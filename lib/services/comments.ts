/**
 * Comments Service
 * Handles comment CRUD operations, likes, and nested replies
 */

import { createClient } from "@/lib/supabase/client"
import type { Comment, CommentLike } from "@/types/database.types"

// ===========================================
// TYPES
// ===========================================

export interface CommentWithAuthor extends Comment {
  author_name: string
  author_avatar: string
  author_headline?: string
  time_ago: string
  replies?: CommentWithAuthor[]
  user_has_liked?: boolean
}

export interface CreateCommentInput {
  post_id: string
  content: string
  parent_id?: string
}

export interface FetchCommentsOptions {
  postId: string
  limit?: number
  includeReplies?: boolean
}

// ===========================================
// COMMENTS SERVICE
// ===========================================

/**
 * Fetch comments for a post with optional nested replies
 */
export async function fetchComments(
  options: FetchCommentsOptions
): Promise<{
  data: CommentWithAuthor[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    // Fetch top-level comments
    let query = supabase
      .from("comments")
      .select(`
        *,
        author:profiles (
          display_name,
          full_name,
          avatar_url,
          headline
        )
      `)
      .eq("post_id", options.postId)
      .is("parent_id", null)
      .order("created_at", { ascending: true })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data: comments, error: commentsError } = await query

    if (commentsError) throw commentsError

    // Map comments with author info
    const mappedComments: CommentWithAuthor[] = (comments || []).map((comment) => ({
      ...comment,
      author_name: comment.author?.display_name || comment.author?.full_name || "Unknown",
      author_avatar: comment.author?.avatar_url || "",
      author_headline: comment.author?.headline,
      time_ago: formatTimeAgo(comment.created_at),
      replies: [],
    }))

    // Fetch replies if requested
    if (options.includeReplies !== false) {
      for (const comment of mappedComments) {
        const { data: replies } = await supabase
          .from("comments")
          .select(`
            *,
            author:profiles (
              display_name,
              full_name,
              avatar_url,
              headline
            )
          `)
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true })

        if (replies) {
          comment.replies = replies.map((reply) => ({
            ...reply,
            author_name: reply.author?.display_name || reply.author?.full_name || "Unknown",
            author_avatar: reply.author?.avatar_url || "",
            author_headline: reply.author?.headline,
            time_ago: formatTimeAgo(reply.created_at),
          }))
        }
      }
    }

    // Fetch user's likes on these comments
    if (user) {
      const commentIds = mappedComments.map((c) => c.id)
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds)

      const likedCommentIds = new Set(likes?.map((l) => l.comment_id) || [])
      mappedComments.forEach((comment) => {
        comment.user_has_liked = likedCommentIds.has(comment.id)
      })
    }

    return { data: mappedComments, error: null }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch a single comment by ID
 */
export async function fetchCommentById(commentId: string): Promise<{
  data: CommentWithAuthor | null
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles (
          display_name,
          full_name,
          avatar_url,
          headline
        )
      `)
      .eq("id", commentId)
      .single()

    if (error) throw error

    const mappedComment: CommentWithAuthor = {
      ...data,
      author_name: data.author?.display_name || data.author?.full_name || "Unknown",
      author_avatar: data.author?.avatar_url || "",
      author_headline: data.author?.headline,
      time_ago: formatTimeAgo(data.created_at),
      replies: [],
    }

    return { data: mappedComment, error: null }
  } catch (error) {
    console.error("Error fetching comment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  input: CreateCommentInput
): Promise<{
  data: Comment | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to comment.") }
    }

    // Validate input
    if (!input.content.trim()) {
      return { data: null, error: new Error("Comment cannot be empty") }
    }

    if (input.content.length > 5000) {
      return { data: null, error: new Error("Comment too long (max 5000 characters)") }
    }

    // Insert comment
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: input.post_id,
        author_id: user.id,
        content: input.content.trim(),
        parent_id: input.parent_id,
      })
      .select()
      .single()

    if (error) throw error

    // Update comment count on post
    await supabase.rpc("increment_comment_count", {
      post_id: input.post_id,
    })

    return { data, error: null }
  } catch (error) {
    console.error("Error creating comment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Update a comment (only author can edit)
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<{
  data: Comment | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to edit comments.") }
    }

    // Verify user owns the comment
    const { data: existingComment } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", commentId)
      .single()

    if (!existingComment || existingComment.author_id !== user.id) {
      return { data: null, error: new Error("Not authorized to edit this comment") }
    }

    const { data, error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("author_id", user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error updating comment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Delete a comment (only author can delete)
 */
export async function deleteComment(commentId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to delete comments.") }
    }

    // Get comment to find post_id for updating count
    const { data: comment } = await supabase
      .from("comments")
      .select("post_id, author_id")
      .eq("id", commentId)
      .single()

    if (!comment) {
      return { error: new Error("Comment not found") }
    }

    if (comment.author_id !== user.id) {
      return { error: new Error("Not authorized to delete this comment") }
    }

    // Delete comment (cascade will delete likes and replies)
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id)

    if (error) throw error

    // Update comment count on post
    await supabase.rpc("decrement_comment_count", {
      post_id: comment.post_id,
    })

    return { error: null }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// COMMENT LIKES SERVICE
// ===========================================

/**
 * Like a comment
 */
export async function likeComment(commentId: string): Promise<{
  data: CommentLike | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to like comments.") }
    }

    const { data, error } = await supabase
      .from("comment_likes")
      .insert({
        comment_id: commentId,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Increment like count
    await supabase.rpc("increment_like_count", {
      comment_id: commentId,
    })

    return { data, error: null }
  } catch (error) {
    console.error("Error liking comment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(commentId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to unlike comments.") }
    }

    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id)

    if (error) throw error

    // Decrement like count
    await supabase.rpc("decrement_like_count", {
      comment_id: commentId,
    })

    return { error: null }
  } catch (error) {
    console.error("Error unliking comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Toggle like on a comment
 */
export async function toggleLikeComment(
  commentId: string,
  isLiked: boolean
): Promise<{ error: Error | null }> {
  if (isLiked) {
    return unlikeComment(commentId)
  } else {
    return likeComment(commentId)
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
