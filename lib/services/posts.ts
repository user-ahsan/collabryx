import { createClient } from "@/lib/supabase/client"
import { formatTimeAgo } from "@/lib/utils/time-ago"
import { logger } from "@/lib/logger"
import { cosineSimilarity } from "@/lib/services/match-generator"
import { calculateHybridScore } from "@/lib/services/feed-scorer"
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
    role?: string
  }
}

export async function fetchPosts(options: PostsQueryOptions = {}): Promise<{
  data: PostWithAuthor[]
  error: Error | null
  queryCount?: number
  duration?: number
}> {
  const queryStartTime = Date.now()
  let queryCount = 0

  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.api.error("Auth error fetching posts", authError, { userId: user?.id })
      return { data: [], error: new Error("Authentication failed. Please log in again."), queryCount: 0 }
    }

    if (!user) {
      logger.api.warn("No authenticated user - returning empty posts")
      return { data: [], error: new Error("Please log in to view posts."), queryCount: 0 }
    }

    logger.api.debug("Fetching posts", { userId: user.id, options })

    let query = supabase
      .from("posts")
      .select(`
        id, author_id, content, post_type, intent, link_url,
        is_pinned, is_archived, reaction_count, comment_count, share_count,
        version, created_at, updated_at,
        author:profiles (
          full_name,
          display_name,
          avatar_url,
          role
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
      logger.api.error("Supabase query error", error, { code: error.code, details: error.details })
      throw error
    }

    queryCount++
    const queryDuration = Date.now() - queryStartTime

    logger.api.debug("Posts fetched successfully", { count: data?.length || 0, duration: queryDuration })

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
      author_role: post.author?.role || "Member",
      author_avatar: post.author?.avatar_url || "",
      time_ago: formatTimeAgo(post.created_at),
    }))

    return { data: mappedPosts, error: null, queryCount, duration: queryDuration }
  } catch (error) {
    const queryDuration = Date.now() - queryStartTime
    logger.api.error("Error fetching posts", error, { queryCount, duration: queryDuration })
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error"), queryCount, duration: queryDuration }
  }
}

/**
 * Fetch personalized feed by computing hybrid scores at request-time.
 * Uses real DB data: embeddings, connections, interests, post freshness.
 * No cron job or Docker worker needed — scores are computed live.
 */
export async function fetchPersonalizedFeed(options: PostsQueryOptions = {}): Promise<{
  data: PostWithAuthor[]
  error: Error | null
  queryCount?: number
  duration?: number
}> {
  const queryStartTime = Date.now()
  let queryCount = 0

  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.api.error("Auth error fetching personalized feed", authError)
      return { data: [], error: new Error("Authentication failed"), queryCount: 0 }
    }

    // 1. Check viewer has embedding — otherwise fall back to chronological
    const { data: viewerEmbedding } = await supabase
      .from("profile_embeddings")
      .select("embedding")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .single()

    queryCount++

    if (!viewerEmbedding?.embedding) {
      logger.api.debug("No viewer embedding — falling back to chronological feed")
      return fetchPosts(options)
    }

    // 2. Get viewer's interests and looking_for
    const { data: viewerInterestsRows } = await supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", user.id)

    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("looking_for")
      .eq("id", user.id)
      .single()

    queryCount += 2

    const viewerInterests = new Set(viewerInterestsRows?.map(r => r.interest) ?? [])
    const viewerLookingFor: string[] = viewerProfile?.looking_for ?? []

    // 3. Fetch recent posts with authors
    const limit = options.limit || 20
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id, author_id, content, post_type, intent, link_url,
        is_pinned, is_archived, reaction_count, comment_count, share_count,
        created_at, updated_at, version,
        author:profiles (id, full_name, display_name, avatar_url, role)
      `)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50) // Fetch enough to score and rank

    queryCount++

    if (postsError) throw postsError
    if (!posts || posts.length === 0) {
      return { data: [], error: null, queryCount, duration: Date.now() - queryStartTime }
    }

    const rawPosts = (posts as unknown) as Array<{
      id: string; author_id: string; content: string;
      post_type: string; intent?: string; link_url?: string;
      is_pinned: boolean; is_archived: boolean;
      reaction_count: number; comment_count: number; share_count: number;
      created_at: string; updated_at: string; version: number;
      author?: { id: string; full_name?: string; display_name?: string; avatar_url?: string; role?: string }
    }>

    // 4. Collect unique author IDs to batch-fetch embeddings + interests + connection status
    const authorIds = [...new Set(rawPosts.map(p => p.author_id))]

    // Batch: author embeddings
    const { data: authorEmbeddingRows } = await supabase
      .from("profile_embeddings")
      .select("user_id, embedding")
      .in("user_id", authorIds)
      .eq("status", "completed")

    queryCount++

    const authorEmbeddings = new Map<string, number[]>()
    for (const row of authorEmbeddingRows ?? []) {
      if (row.embedding) authorEmbeddings.set(row.user_id, row.embedding as unknown as number[])
    }

    // Batch: author interests
    const { data: authorInterestRows } = await supabase
      .from("user_interests")
      .select("user_id, interest")
      .in("user_id", authorIds)

    queryCount++

    const authorInterests = new Map<string, Set<string>>()
    for (const row of authorInterestRows ?? []) {
      if (!authorInterests.has(row.user_id)) authorInterests.set(row.user_id, new Set())
      authorInterests.get(row.user_id)!.add(row.interest)
    }

    // Batch: connections between viewer and all author IDs
    // Two clean queries avoiding complex or()+in() filter syntax
    const { data: connAsRequester } = await supabase
      .from("connections")
      .select("receiver_id")
      .eq("requester_id", user.id)
      .in("receiver_id", authorIds)
      .eq("status", "accepted")

    const { data: connAsReceiver } = await supabase
      .from("connections")
      .select("requester_id")
      .eq("receiver_id", user.id)
      .in("requester_id", authorIds)
      .eq("status", "accepted")

    queryCount += 2

    const connectedUserIds = new Set<string>()
    for (const row of connAsRequester ?? []) connectedUserIds.add(row.receiver_id)
    for (const row of connAsReceiver ?? []) connectedUserIds.add(row.requester_id)

    // 5. Score each post
    const viewerEmbeddingArr = viewerEmbedding.embedding as unknown as number[]
    const now = Date.now()

    const scored = rawPosts.map((post): { post: typeof post; score: number } => {
      const authorEmbedding = authorEmbeddings.get(post.author_id)
      const semantic = authorEmbedding
        ? cosineSimilarity(viewerEmbeddingArr, authorEmbedding)
        : 0.5 // neutral if no embedding

      const isConnected = connectedUserIds.has(post.author_id)

      const authorInts = authorInterests.get(post.author_id)
      const hasSharedInterests = authorInts && authorInts.size > 0 && viewerInterests.size > 0
        ? [...authorInts].some(i => viewerInterests.has(i))
        : false

      const intentMatch = viewerLookingFor.length > 0 && post.intent
        ? viewerLookingFor.some(lf => lf.toLowerCase() === post.intent!.toLowerCase())
        : false

      const hoursOld = (now - new Date(post.created_at).getTime()) / 3600000

      // Derive engagement failures from available signal data:
      // Posts with disproportionately high reactions vs comments may indicate
      // surface-level engagement (e.g., drive-by likes without meaningful interaction).
      // When dedicated tracking (hide_count, report_count) is added to the schema,
      // fetch those values here instead.
      const derivedFailures = Math.max(0, Math.round(post.reaction_count / 3) - post.comment_count)

      const score = calculateHybridScore({
        semantic: Math.max(0, Math.min(1, semantic)),
        engagementSuccesses: post.reaction_count + post.comment_count,
        engagementFailures: derivedFailures,
        hoursOld,
        isConnected,
        hasSharedInterests,
        intentMatch,
      })

      return { post, score }
    })

    // 6. Sort by score descending, take top N
    scored.sort((a, b) => b.score - a.score)
    const topPosts = scored.slice(0, limit)

    // 7. Map to PostWithAuthor
    const mappedPosts: PostWithAuthor[] = topPosts.map(({ post: raw }) => ({
      id: raw.id,
      author_id: raw.author_id,
      content: raw.content,
      post_type: raw.post_type as Post["post_type"],
      intent: raw.intent as Post["intent"],
      link_url: raw.link_url,
      is_pinned: raw.is_pinned,
      is_archived: raw.is_archived,
      reaction_count: raw.reaction_count,
      comment_count: raw.comment_count,
      share_count: raw.share_count,
      version: raw.version,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      author_name: raw.author?.display_name || raw.author?.full_name || "Unknown",
      author_role: raw.author?.role || "Member",
      author_avatar: raw.author?.avatar_url || "",
      time_ago: formatTimeAgo(raw.created_at),
    }))

    const duration = Date.now() - queryStartTime
    logger.api.debug("Personalized feed computed", { count: mappedPosts.length, duration })
    return { data: mappedPosts, error: null, queryCount, duration }
  } catch (error) {
    const queryDuration = Date.now() - queryStartTime
    logger.api.error("Error fetching personalized feed", error, { queryCount, duration: queryDuration })
    // Fall back to chronological on any error
    return fetchPosts(options)
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
      logger.api.error("Auth error adding attachment", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to view posts.") }
    }

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id, author_id, content, post_type, intent, link_url,
        is_pinned, is_archived, reaction_count, comment_count, share_count,
        version, created_at, updated_at,
        author:profiles (
          full_name,
          display_name,
          avatar_url,
          role
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
      author_role: data.author?.role || "Member",
      author_avatar: data.author?.avatar_url || "",
      time_ago: formatTimeAgo(data.created_at),
    }

    return { data: mappedPost, error: null }
  } catch (error) {
    logger.api.error("Error fetching post", error, { postId })
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
      .select('id, author_id, content, post_type, intent, link_url, is_pinned, is_archived, reaction_count, comment_count, share_count, version, created_at, updated_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.api.error("Error creating post", error)
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
      logger.api.error("Auth error deleting post", authError)
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
    logger.api.error("Error deleting post", error)
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
        .select('id, author_id, content, post_type, intent, link_url, is_pinned, is_archived, reaction_count, comment_count, share_count, version, created_at, updated_at')
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
    } catch (error) {
      if (attempt === maxRetries) {
        logger.api.error("Error updating post after retries", error)
        return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
      }
      onRetry?.(attempt, error as Error)
      await new Promise(resolve => setTimeout(resolve, 50 * attempt))
    }
  }

  return { data: null, error: new Error("Failed to update after retries"), conflict: true }
}

/**
 * Atomically increment post counter fields (reaction_count, comment_count, share_count)
 * Uses Supabase RPC atomic increment, falling back to optimistic locking with version
 * retry when the RPC function is unavailable.
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
        // RPC function doesn't exist — fall back to optimistic locking with retry
        const postIdStr = postId
        const fieldStr = field
        const { data: currentPost } = await supabase
          .from("posts")
          .select([fieldStr, "version"].join(","))
          .eq("id", postIdStr)
          .single()

        if (!currentPost) {
          throw new Error("Post not found")
        }

        const currentValue = (currentPost[fieldStr as keyof typeof currentPost] as number) || 0
        const currentVersion = (currentPost as unknown as { version: number }).version
        const { success, conflict, error: lockError } = await updatePostCounterWithLock(
          postIdStr,
          fieldStr,
          currentValue + delta,
          currentVersion,
          { maxRetries: 3 }
        )

        if (!success && conflict) {
          logger.api.warn("Counter update conflict after retries — skipping", { postId, field })
        }
        if (lockError) throw lockError
      } else {
        throw error
      }
    }

    return { error: null }
  } catch (error) {
    logger.api.error("Error incrementing counter", error)
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
        .select('id, version')
        .single()

      if (error || !data) {
        if (attempt < maxRetries) {
          const currentPost = await supabase
            .from("posts")
            .select('version')
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
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error instanceof Error ? error : new Error("Failed to update counter") }
      }
      onRetry?.(attempt, error as Error)
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
      logger.api.error("Auth error adding reaction", authError)
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
      .select('id, post_id, user_id, emoji, created_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.api.error("Error adding reaction", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeReaction(postId: string, emoji: string): Promise<{ error: Error | null }> {
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
      .eq("emoji", emoji)

    if (error) throw error

    return { error: null }
  } catch (error) {
    logger.api.error("Error removing reaction", error)
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
    const { data: post, error: postFetchError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", input.post_id)
      .single()

    if (postFetchError || !post || post.author_id !== user.id) {
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
      .select('id, post_id, file_url, file_type, file_name, file_size, mime_type, width, height, order_index, created_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.api.error("Error adding attachment", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// formatTimeAgo now imported from @/lib/utils/time-ago (deduplicated)
