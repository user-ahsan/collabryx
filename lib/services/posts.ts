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

export async function fetchPosts(options: PostsQueryOptions = {}): Promise<{
  data: PostWithAuthor[]
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
      return { data: [], error: new Error("Please log in to view posts.") }
    }

    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

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

    const { data, error } = await query

    if (error) throw error

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
    console.error("Error fetching posts:", error)
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


