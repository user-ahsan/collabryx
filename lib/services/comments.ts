import { createClient } from "@/lib/supabase/client"

// ===========================================
// COMMENTS SERVICE
// ===========================================

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id: string | null
  like_count: number
  created_at: string
  updated_at: string
  author?: {
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CommentWithAuthor extends Comment {
  author_name: string
  author_avatar: string
  time_ago: string
  replies?: CommentWithAuthor[]
}

export interface CreateCommentInput {
  post_id: string
  content: string
  parent_id?: string
}

/**
 * Fetch comments for a post (with optional nesting)
 */
export async function fetchComments(
  postId: string,
  options: { limit?: number; parentId?: string } = {}
): Promise<{
  data: CommentWithAuthor[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: [], error: new Error("Please log in to view comments.") }
    }

    let query = supabase
      .from("comments")
      .select(`
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .is("parent_id", options.parentId || null)
      .order("created_at", { ascending: true })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    const mappedComments: CommentWithAuthor[] = ((data as any[]) || []).map((comment: any) => ({
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
      time_ago: formatTimeAgo(comment.created_at),
    }))

    return { data: mappedComments, error: null }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch all comments for a post with nested replies
 */
export async function fetchCommentsWithReplies(postId: string): Promise<{
  data: CommentWithAuthor[]
  error: Error | null
}> {
  try {
    // Fetch top-level comments
    const { data: topLevelComments, error } = await fetchComments(postId, { parentId: undefined })
    
    if (error) throw error

    // Fetch replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const { data: replies } = await fetchComments(postId, { parentId: comment.id })
        return {
          ...comment,
          replies: replies || [],
        }
      })
    )

    return { data: commentsWithReplies, error: null }
  } catch (error) {
    console.error("Error fetching comments with replies:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Create a new comment
 */
export async function createComment(input: CreateCommentInput): Promise<{
  data: Comment | null
  error: Error | null
}> {
  try {
    // Validate input manually
    if (!input.post_id) {
      return { data: null, error: new Error("Post ID is required") }
    }
    if (!input.content || input.content.trim().length === 0) {
      return { data: null, error: new Error("Comment content is required") }
    }
    if (input.content.length > 2000) {
      return { data: null, error: new Error("Comment must be less than 2000 characters") }
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to comment.") }
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: input.post_id,
        author_id: user.id,
        content: input.content.trim(),
        parent_id: input.parent_id || null,
      })
      .select(`
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Create notification for post author (if comment is not on own post)
    if (data.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: data.author_id,
        type: "comment",
        actor_id: user.id,
        actor_name: user.user_metadata?.full_name || "Someone",
        actor_avatar: user.user_metadata?.avatar_url || "",
        content: "commented on your post",
        resource_type: "post",
        resource_id: input.post_id,
      })
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating comment:", error)
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
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to delete comments.") }
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Update a comment (only author can update)
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
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to edit comments.") }
    }

    const { data, error } = await supabase
      .from("comments")
      .update({ content })
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

// ===========================================
// COMMENT LIKES SERVICE
// ===========================================

export async function likeComment(commentId: string): Promise<{
  data: { id: string; comment_id: string; user_id: string } | null
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
      return { data: null, error: new Error("Please log in to like comments.") }
    }

    const { data, error } = await supabase
      .from("comment_likes")
      .upsert(
        {
          comment_id: commentId,
          user_id: user.id,
        },
        { onConflict: "comment_id,user_id" }
      )
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error liking comment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function unlikeComment(commentId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
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
    console.error("Error unliking comment:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Check if user has liked a comment
 */
export async function checkUserLike(commentId: string): Promise<{
  liked: boolean
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { liked: false, error: new Error("Authentication failed") }
    }

    if (!user) {
      return { liked: false, error: null }
    }

    const { data, error } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return { liked: !!data, error: null }
  } catch (error) {
    console.error("Error checking user like:", error)
    return { liked: false, error: error instanceof Error ? error : new Error("Unknown error") }
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
