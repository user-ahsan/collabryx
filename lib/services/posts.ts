import { createClient } from "@/lib/supabase/client"
import type { Post, PostWithAuthor, PostAttachment, PostReaction, PostUpdateInput } from "@/types/database.types"

// ===========================================
// POSTS SERVICE
// ===========================================

export interface PostsQueryOptions {
  limit?: number
  offset?: number
  authorId?: string
  postType?: Post["post_type"]
  includeAttachments?: boolean
  random?: boolean  // Fetch random posts (for new users without embeddings)
}

export interface UpdatePostOptions {
  maxRetries?: number
  onRetry?: (attempt: number, error: Error) => void
}

export interface CreatePostInput {
  content: string
  post_type: Post["post_type"]
  intent?: Post["intent"]
  link_url?: string
  is_pinned?: boolean
}

export interface CreatePostAttachmentInput {
  post_id: string
  file_url: string
  file_type: "image" | "video"
  file_name?: string
  file_size?: number
  mime_type?: string
  width?: number
  height?: number
}

/**
 * Fetch posts with optional filtering and pagination
 */
// Define a local type for the raw Supabase response
type RawPost = {
  id: string
  author_id: string
  content: string
  post_type: "project-launch" | "teammate-request" | "announcement" | "general"
  intent?: "cofounder" | "teammate" | "mvp" | "fyp"
  link_url?: string
  is_pinned: boolean
  is_archived: boolean
  reaction_count: number
  comment_count: number
  share_count: number
  version: number
  created_at: string
  updated_at: string
  author?: {
    full_name?: string
    display_name?: string
    avatar_url?: string
  }
}

export async function fetchPosts(options: PostsQueryOptions = {}): Promise<{
  data: PostWithAuthor[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", {
        message: authError.message,
        stack: authError.stack,
      })
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      console.log("No authenticated user - returning empty posts")
      return { data: [], error: new Error("Please log in to view posts.") }
    }

    console.log("Fetching posts for user:", user.id, "with options:", options)

    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq("is_archived", false)

    // Random posts for new users (before embeddings are generated)
    if (options.random) {
      // Use ORDER BY created_at for pagination support
      query = query.order("created_at", { ascending: false })
      
      // Support pagination for random posts
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
      } else if (options.limit) {
        query = query.limit(options.limit)
      }
    } else {
      // Default: ordered by creation date
      query = query.order("created_at", { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
      }

      if (options.authorId) {
        query = query.eq("author_id", options.authorId)
      }

      if (options.postType) {
        query = query.eq("post_type", options.postType)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Supabase query error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw error
    }

    console.log("Posts fetched successfully:", data?.length || 0, "posts")
    if (data && data.length > 0) {
      console.log("First post sample:", JSON.stringify(data[0], null, 2))
    }

    const mappedPosts: PostWithAuthor[] = (data as RawPost[] || []).map((post) => ({
      id: post.id,
      author_id: post.author_id,
      content: post.content,
      post_type: post.post_type,
      intent: post.intent,
      link_url: post.link_url,
      is_pinned: post.is_pinned,
      is_archived: post.is_archived,
      reaction_count: post.reaction_count,
      comment_count: post.comment_count,
      share_count: post.share_count,
      version: post.version,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_name: post.author?.display_name || post.author?.full_name || "Unknown",
      author_role: "Member",
      author_avatar: post.author?.avatar_url || "",
      time_ago: formatTimeAgo(post.created_at),
    }))

    return { data: mappedPosts, error: null }
  } catch (error: any) {
    console.error("Error fetching posts:", {
      message: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      error: error,
    })
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch a single post by ID
 */
export async function fetchPostById(postId: string): Promise<{
  data: PostWithAuthor | null
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
      return { data: null, error: new Error("Please log in to view posts.") }
    }

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq("id", postId)
      .eq("is_archived", false)
      .single()

    if (error) throw error

    const mappedPost: PostWithAuthor = {
      id: data.id,
      author_id: data.author_id,
      content: data.content,
      post_type: data.post_type,
      intent: data.intent,
      link_url: data.link_url,
      is_pinned: data.is_pinned,
      is_archived: data.is_archived,
      reaction_count: data.reaction_count,
      comment_count: data.comment_count,
      share_count: data.share_count,
      version: data.version,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author_name: data.author?.display_name || data.author?.full_name || "Unknown",
      author_role: "Member",
      author_avatar: data.author?.avatar_url || "",
      time_ago: formatTimeAgo(data.created_at),
    }

    return { data: mappedPost, error: null }
  } catch (error) {
    console.error("Error fetching post:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<{
  data: Post | null
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
      return { data: null, error: new Error("Please log in to create posts.") }
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: input.content,
        post_type: input.post_type,
        intent: input.intent,
        link_url: input.link_url,
        is_pinned: input.is_pinned || false,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error creating post:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Delete a post (only author can delete)
 */
export async function deletePost(postId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to delete posts.") }
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error deleting post:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Update a post with optimistic locking to prevent race conditions
 * Uses version field to detect concurrent modifications
 */
export async function updatePostWithLock(
  postId: string,
  updates: PostUpdateInput,
  options: UpdatePostOptions = {}
): Promise<{
  data: Post | null
  error: Error | null
  conflict?: boolean
}> {
  const { maxRetries = 3, onRetry } = options
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        return { data: null, error: new Error("Authentication failed") }
      }

      if (!user) {
        return { data: null, error: new Error("Please log in to update posts.") }
      }

      const { data, error } = await supabase
        .from("posts")
        .update({
          ...updates,
          version: updates.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("author_id", user.id)
        .eq("version", updates.version)
        .select()
        .single()

      if (error) {
        if (error.code === "PGRST116" || !data) {
          if (attempt < maxRetries) {
            const currentPost = await supabase
              .from("posts")
              .select("version")
              .eq("id", postId)
              .single()
            
            if (currentPost.data) {
              updates.version = currentPost.data.version
              onRetry?.(attempt, new Error(`Version conflict, retrying with version ${updates.version}`))
              await new Promise(resolve => setTimeout(resolve, 50 * attempt))
              continue
            }
          }
          return { data: null, error: new Error("Post was modified by another user"), conflict: true }
        }
        throw error
      }

      return { data, error: null, conflict: false }
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error("Error updating post after retries:", error)
        return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
      }
      onRetry?.(attempt, error)
      await new Promise(resolve => setTimeout(resolve, 50 * attempt))
    }
  }

  return { data: null, error: new Error("Failed to update after retries"), conflict: true }
}

/**
 * Atomically increment post counter fields (reaction_count, comment_count, share_count)
 * Uses Supabase atomic increment to avoid race conditions
 */
export async function incrementPostCounter(
  postId: string,
  field: "reaction_count" | "comment_count" | "share_count",
  delta: number = 1
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.rpc("increment_post_counter", {
      post_id: postId,
      counter_field: field,
      increment_by: delta,
    })

    if (error) {
      if (error.code === "42883") {
        const { error: fallbackError } = await supabase
          .from("posts")
          .update({ [field]: supabase.rpc("get_counter_with_lock", { post_id: postId, field }) })
          .eq("id", postId)
        
        if (fallbackError) throw fallbackError
      } else {
        throw error
      }
    }

    return { error: null }
  } catch (error: any) {
    console.error("Error incrementing counter:", error)
    return { error: error instanceof Error ? error : new Error("Failed to update counter") }
  }
}

/**
 * Update post counter with optimistic locking and retry logic
 */
export async function updatePostCounterWithLock(
  postId: string,
  field: "reaction_count" | "comment_count" | "share_count",
  value: number,
  expectedVersion: number,
  options: UpdatePostOptions = {}
): Promise<{ success: boolean; conflict?: boolean; error?: Error }> {
  const { maxRetries = 3, onRetry } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("posts")
        .update({
          [field]: value,
          version: expectedVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("version", expectedVersion)
        .select()
        .single()

      if (error || !data) {
        if (attempt < maxRetries) {
          const currentPost = await supabase
            .from("posts")
            .select()
            .eq("id", postId)
            .single()
          
          if (currentPost.data) {
            expectedVersion = (currentPost.data as Post).version
            onRetry?.(attempt, new Error(`Version conflict on counter update`))
            await new Promise(resolve => setTimeout(resolve, 50 * attempt))
            continue
          }
        }
        return { success: false, conflict: true, error: new Error("Conflict updating counter") }
      }

      return { success: true, conflict: false }
    } catch (error: any) {
      if (attempt === maxRetries) {
        return { success: false, error: error instanceof Error ? error : new Error("Failed to update counter") }
      }
      onRetry?.(attempt, error)
      await new Promise(resolve => setTimeout(resolve, 50 * attempt))
    }
  }

  return { success: false, conflict: true }
}

// ===========================================
// POST REACTIONS SERVICE
// ===========================================

export async function addReaction(
  postId: string,
  emoji: string
): Promise<{ data: PostReaction | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to react to posts.") }
    }

    const { data, error } = await supabase
      .from("post_reactions")
      .upsert(
        {
          post_id: postId,
          user_id: user.id,
          emoji,
        },
        { onConflict: "post_id,user_id" }
      )
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding reaction:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeReaction(postId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to remove reactions.") }
    }

    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error removing reaction:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// POST ATTACHMENTS SERVICE
// ===========================================

export async function addAttachment(
  input: CreatePostAttachmentInput
): Promise<{ data: PostAttachment | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to add attachments.") }
    }

    // Verify user owns the post
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", input.post_id)
      .single()

    if (!post || post.author_id !== user.id) {
      return { data: null, error: new Error("Not authorized to add attachments to this post") }
    }

    const { data, error } = await supabase
      .from("post_attachments")
      .insert({
        post_id: input.post_id,
        file_url: input.file_url,
        file_type: input.file_type,
        file_name: input.file_name,
        file_size: input.file_size,
        mime_type: input.mime_type,
        width: input.width,
        height: input.height,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding attachment:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
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


