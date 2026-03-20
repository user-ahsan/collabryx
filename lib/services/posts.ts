import { createClient } from "@/lib/supabase/client"
import type { Post, PostWithAuthor, PostAttachment, PostReaction } from "@/types/database.types"

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
  created_at: string
  updated_at: string
  author?: {
    full_name?: string
    display_name?: string
    avatar_url?: string
  }
}

/**
 * Fetch posts with optional filtering and pagination
 * 
 * @param options - Query options for filtering and pagination
 * @returns Object with posts data and error information
 * 
 * @example
 * ```typescript
 * const { data, error } = await fetchPosts({ limit: 20, offset: 0 })
 * if (error) {
 *   console.error('Failed to fetch posts:', error.message)
 * }
 * ```
 */
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
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_name: post.author?.display_name || post.author?.full_name || "Unknown",
      author_role: "Member",
      author_avatar: post.author?.avatar_url || "",
      time_ago: formatTimeAgo(post.created_at),
    }))

    return { data: mappedPosts, error: null }
  } catch (error) {
    console.error("Error fetching posts:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined,
      error: error,
    })
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch a single post by ID
 * 
 * @param postId - The ID of the post to fetch
 * @returns Object with post data and error information
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
 * 
 * @param input - Post creation input data
 * @returns Object with created post data and error information
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
        in
