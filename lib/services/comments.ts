/**
 * Comments Service
 * Handles comment CRUD operations, nested replies, and likes
 * 
 * @module services/comments
 */

import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { z } from "zod"
import type { Comment, CommentLike } from "@/types/database.types"

// Module-specific logger
const log = logger.app

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

const CreateCommentSchema = z.object({
  post_id: z.string().uuid("Invalid post ID format"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment too long (max 5000 characters)"),
  parent_id: z.string().uuid("Invalid parent ID format").optional(),
})

const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment too long (max 5000 characters)"),
})

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
 * 
 * @param options - Fetch options including postId, limit, and includeReplies
 * @returns Array of comments with author info and nested replies
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
      id: comment.id,
      post_id: comment.post_id,
      author_id: comment.author_id,
      content: comment.content,
      parent_id: comment.parent_id,
      like_count: comment.like_count,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
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
            id: reply.id,
            post_id: reply.post_id,
            author_id: reply.author_id,
            content: reply.content,
            parent_id: reply.parent_id,
            like_count: reply.like_count,
            created_at: reply.created_at,
            updated_at: reply.updated_at,
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
    log.error("Error fetching comments:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("Unknown error fetching comments") 
    }
  }
}

/**
 * Fetch a single comment by ID
 * 
 * @param commentId - Comment UUID
 * @returns Comment with author info or null
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
      id: data.id,
      post_id: data.post_id,
      author_id: data.author_id,
      content: data.content,
      parent_id: data.parent_id,
      like_count: data.like_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author_name: data.author?.display_name || data.author?.full_name || "Unknown",
      author_avatar: data.author?.avatar_url || "",
      author_headline: data.author?.headline,
      time_ago: formatTimeAgo(data.created_at),
      replies: [],
    }

    return { data: mappedComment, error: null }
  } catch (error) {
    log.error("Error fetching comment:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error fetching comment") 
    }
  }
}

/**
 * Create a new comment
 * 
 * @param input - Comment creation input
 * @returns Created comment or error
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
      log.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to comment.") }
    }

    // Validate input
    const validation = CreateCommentSchema.safeParse(input)
    if (!validation.success) {
      return { 
        data: null, 
        error: new Error(validation.error.errors[0]?.message || "Invalid comment data") 
      }
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

    return { data, error: null }
  } catch (error) {
    log.error("Error creating comment:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error creating comment") 
    }
  }
}

/**
 * Update a comment (only author can edit)
 * 
 * @param commentId - Comment UUID
 * @param content - New content
 * @returns Updated comment or error
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

    // Validate content
    const validation = UpdateCommentSchema.safeParse({ content })
    if (!validation.success) {
      return { 
        data: null, 
        error: new Error(validation.error.errors[0]?.message || "Invalid comment data") 
      }
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
    log.error("Error updating comment:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error updating comment") 
    }
  }
}

/**
 * Delete a comment (only author can delete)
 * 
 * @param commentId - Comment UUID
 * @returns Error or null if successful
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

    return { error: null }
  } catch (error) {
    log.error("Error deleting comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error deleting comment") }
  }
}

// ===========================================
// COMMENT LIKES SERVICE
// ===========================================

/**
 * Like a comment
 * 
 * @param commentId - Comment UUID
 * @returns Created like or error
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

    return { data, error: null }
  } catch (error) {
    log.error("Error liking comment:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error liking comment") 
    }
  }
}

/**
 * Unlike a comment
 * 
 * @param commentId - Comment UUID
 * @returns Error or null if successful
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

    return { error: null }
  } catch (error) {
    log.error("Error unliking comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error unliking comment") }
  }
}

/**
 * Toggle like on a comment
 * 
 * @param commentId - Comment UUID
 * @param isLiked - Current like status
 * @returns Error or null if successful
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

/**
 * Format timestamp to relative time string
 * 
 * @param dateString - ISO date string
 * @returns Formatted time ago string (e.g., "2h ago", "Just now")
 */
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
