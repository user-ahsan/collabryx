/**
 * Notifications Service
 * Handles notification CRUD operations and real-time updates
 * 
 * @module services/notifications
 */

import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { z } from "zod"
import type { Notification } from "@/types/database.types"
import { formatTimeAgo } from "@/lib/utils/time-ago"

// Module-specific logger
const log = logger.app

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  type: z.enum(['connect', 'connect_accepted', 'message', 'like', 'comment', 'comment_like', 'match', 'mention', 'system', 'achievement']),
  content: z.string().min(1).max(500),
  actor_id: z.string().uuid().optional(),
  resource_type: z.enum(['post', 'profile', 'conversation', 'match', 'comment']).optional(),
  resource_id: z.string().uuid().optional(),
})

// ===========================================
// TYPES
// ===========================================

export interface NotificationWithActor extends Notification {
  actor_name?: string
  actor_avatar?: string
  time_ago: string
  /** Post data for post-related notifications */
  post?: {
    id: string
    title?: string
    content?: string
    author_id?: string
  } | null
}

export interface FetchNotificationsOptions {
  limit?: number
  unread_only?: boolean
}

export interface CreateNotificationInput {
  user_id: string
  type: Notification["type"]
  content: string
  actor_id?: string
  resource_type?: Notification["resource_type"]
  resource_id?: string
}

// ===========================================
// NOTIFICATIONS SERVICE
// ===========================================

/**
 * Fetch notifications for the current user
 * 
 * @param options - Fetch options (limit, unread_only)
 * @returns Array of notifications with actor info
 */
export async function fetchNotifications(
  options?: FetchNotificationsOptions
): Promise<{
  data: NotificationWithActor[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    let query = supabase
      .from("notifications")
      .select(`
        id,
        user_id,
        type,
        actor_id,
        actor_name,
        actor_avatar,
        content,
        resource_type,
        resource_id,
        is_read,
        is_actioned,
        created_at,
        actor:profiles!notifications_actor_id_fkey (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (options?.unread_only) {
      query = query.eq("is_read", false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: notifications, error } = await query

    if (error) {
      // Augment Supabase error with query context for better debugging
      const enhanced = new Error(`[Supabase] ${error.message || "Query failed"}`)
      ;(enhanced as unknown as Record<string, unknown>).code = error.code
      ;(enhanced as unknown as Record<string, unknown>).details = error.details
      ;(enhanced as unknown as Record<string, unknown>).hint = error.hint
      throw enhanced
    }

    // Batch-fetch post data for post-related notifications
    const postIds = (notifications || [])
      .filter((n) => n.resource_type === 'post' && n.resource_id)
      .map((n) => n.resource_id!)
    
    const postsMap = new Map<string, { id: string; title: string; content: string }>()
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, content')
        .in('id', postIds)
      if (posts) {
        for (const p of posts) {
          postsMap.set(p.id, p)
        }
      }
    }

    const mappedNotifications: NotificationWithActor[] = (notifications || []).map((notif) => {
      const actor = notif.actor?.[0]
      const postData = notif.resource_type === 'post' && notif.resource_id
        ? postsMap.get(notif.resource_id)
        : undefined
      
      return {
        id: notif.id,
        user_id: notif.user_id,
        type: notif.type,
        actor_id: notif.actor_id,
        actor_name: actor?.display_name || actor?.full_name || notif.actor_name,
        actor_avatar: actor?.avatar_url || notif.actor_avatar,
        content: notif.content,
        resource_type: notif.resource_type,
        resource_id: notif.resource_id,
        is_read: notif.is_read,
        is_actioned: notif.is_actioned,
        created_at: notif.created_at,
        time_ago: formatTimeAgo(notif.created_at),
        post: postData ? {
          id: postData.id,
          title: postData.title,
          content: postData.content,
        } : null,
      }
    })

    return { data: mappedNotifications, error: null }
  } catch (error) {
    log.error("Error fetching notifications:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("[Notifications] Failed to fetch notifications") 
    }
  }
}

/**
 * Mark a notification as read
 * 
 * @param notificationId - Notification UUID
 * @returns Updated notification or error
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{
  data: Notification | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to mark notifications as read.") }
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select('id, user_id, type, actor_id, content, resource_type, resource_id, is_read, is_actioned, created_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error marking notification as read:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("[Notifications] Failed to mark notification as read") 
    }
  }
}

/**
 * Mark all notifications as read for the current user
 * 
 * @returns Error or null if successful
 */
export async function markAllNotificationsAsRead(): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to mark notifications as read.") }
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error marking all notifications as read:", error)
    return { error: error instanceof Error ? error : new Error("[Notifications] Failed to mark all notifications as read") }
  }
}

/**
 * Delete a notification
 * 
 * @param notificationId - Notification UUID
 * @returns Error or null if successful
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to delete notifications.") }
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error deleting notification:", error)
    return { error: error instanceof Error ? error : new Error("[Notifications] Failed to delete notification") }
  }
}

/**
 * Delete all notifications for the current user
 * 
 * @returns Error or null if successful
 */
export async function deleteAllNotifications(): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to delete notifications.") }
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error deleting all notifications:", error)
    return { error: error instanceof Error ? error : new Error("[Notifications] Failed to delete all notifications") }
  }
}

/**
 * Get unread notification count for the current user
 * 
 * @returns Count of unread notifications
 */
export async function getUnreadCount(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { count: 0, error: new Error("Not authenticated") }
    }

    if (!user) {
      return { count: 0, error: new Error("Not authenticated") }
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    // Don't log "Not authenticated" as an error — it's a normal state during page transitions
    if (error instanceof Error && error.message === "Not authenticated") {
      return { count: 0, error }
    }
    log.error("Error getting unread count:", error)
    return { count: 0, error: error instanceof Error ? error : new Error("[Notifications] Failed to get unread count") }
  }
}

/**
 * Create a notification (internal helper)
 * 
 * @param input - Notification creation input
 * @returns Created notification or error
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{
  data: Notification | null
  error: Error | null
}> {
  try {
    const supabase = createClient()

    // Validate input
    const validation = CreateNotificationSchema.safeParse(input)
    if (!validation.success) {
      return { 
        data: null, 
        error: new Error(validation.error.errors[0]?.message || "Invalid notification data") 
      }
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: input.user_id,
        type: input.type,
        content: input.content,
        actor_id: input.actor_id,
        resource_type: input.resource_type,
        resource_id: input.resource_id,
      })
      .select('id, user_id, type, actor_id, content, resource_type, resource_id, is_read, is_actioned, created_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error creating notification:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("[Notifications] Failed to create notification") 
    }
  }
}

/**
 * Send connection request notification (helper)
 * 
 * @param receiverId - User receiving the notification
 * @param requesterId - User who sent the request
 * @param requesterName - Display name of requester
 * @returns Error or null
 */
export async function sendConnectionRequestNotification(
  receiverId: string,
  requesterId: string,
  requesterName?: string
): Promise<{ error: Error | null }> {
  const name = requesterName || 'Someone'
  const { error } = await createNotification({
    user_id: receiverId,
    type: 'connect',
    content: `${name} wants to connect with you`,
    actor_id: requesterId,
    resource_type: 'profile',
    resource_id: requesterId,
  })

  return { error }
}

/**
 * Send connection accepted notification (helper)
 * 
 * @param originalRequesterId - User who originally sent the request
 * @param accepterId - User who accepted
 * @param accepterName - Display name of accepter
 * @returns Error or null
 */
export async function sendConnectionAcceptedNotification(
  originalRequesterId: string,
  accepterId: string,
  accepterName?: string
): Promise<{ error: Error | null }> {
  const name = accepterName || 'Someone'
  const { error } = await createNotification({
    user_id: originalRequesterId,
    type: 'connect_accepted',
    content: `${name} accepted your connection request`,
    actor_id: accepterId,
    resource_type: 'profile',
    resource_id: accepterId,
  })

  return { error }
}

/**
 * Send comment notification (helper)
 * 
 * @param postAuthorId - Post author receiving notification
 * @param commenterId - User who commented
 * @param postId - Post ID
 * @param commenterName - Display name of commenter
 * @param postExcerpt - Short excerpt of the post
 * @returns Error or null
 */
export async function sendCommentNotification(
  postAuthorId: string,
  commenterId: string,
  postId: string,
  commenterName?: string,
  postExcerpt?: string
): Promise<{ error: Error | null }> {
  const name = commenterName || 'Someone'
  const context = postExcerpt ? ` on "${postExcerpt}"` : ''
  const { error } = await createNotification({
    user_id: postAuthorId,
    type: 'comment',
    content: `${name} commented on your post${context}`,
    actor_id: commenterId,
    resource_type: 'post',
    resource_id: postId,
  })

  return { error }
}

/**
 * Send like notification (helper) - only sends if not self-like
 * 
 * @param postAuthorId - Post author receiving notification
 * @param likerId - User who liked
 * @param postId - Post ID
 * @param likerName - Display name of liker
 * @returns Error or null
 */
export async function sendLikeNotification(
  postAuthorId: string,
  likerId: string,
  postId: string,
  likerName?: string
): Promise<{ error: Error | null }> {
  // Don't notify if user likes their own post
  if (postAuthorId === likerId) return { error: null }

  const name = likerName || 'Someone'
  const { error } = await createNotification({
    user_id: postAuthorId,
    type: 'like',
    content: `${name} liked your post`,
    actor_id: likerId,
    resource_type: 'post',
    resource_id: postId,
  })

  return { error }
}

/**
 * Send comment like notification (helper)
 * 
 * @param commentAuthorId - Comment author receiving notification
 * @param likerId - User who liked the comment
 * @param commentId - Comment ID
 * @param likerName - Display name of liker
 * @returns Error or null
 */
export async function sendCommentLikeNotification(
  commentAuthorId: string,
  likerId: string,
  commentId: string,
  likerName?: string
): Promise<{ error: Error | null }> {
  // Don't notify if user likes their own comment
  if (commentAuthorId === likerId) return { error: null }

  const name = likerName || 'Someone'
  const { error } = await createNotification({
    user_id: commentAuthorId,
    type: 'comment_like',
    content: `${name} liked your comment`,
    actor_id: likerId,
    resource_type: 'comment',
    resource_id: commentId,
  })

  return { error }
}

/**
 * Send mention notification (helper)
 * 
 * @param mentionedUserId - User being mentioned
 * @param mentionerId - User who mentioned them
 * @param mentionerName - Display name of mentioner
 * @param resourceType - Type of resource (post/comment)
 * @param resourceId - Resource ID
 * @returns Error or null
 */
export async function sendMentionNotification(
  mentionedUserId: string,
  mentionerId: string,
  mentionerName?: string,
  resourceType?: 'post' | 'comment',
  resourceId?: string
): Promise<{ error: Error | null }> {
  if (mentionedUserId === mentionerId) return { error: null }

  const name = mentionerName || 'Someone'
  const { error } = await createNotification({
    user_id: mentionedUserId,
    type: 'mention',
    content: `${name} mentioned you in a ${resourceType || 'post'}`,
    actor_id: mentionerId,
    resource_type: resourceType === 'comment' ? 'comment' : 'post',
    resource_id: resourceId,
  })

  return { error }
}

/**
 * Send match notification (helper)
 * 
 * @param userId - User receiving the notification
 * @param matchedUserId - Matched user ID
 * @param matchPercentage - Match percentage
 * @returns Error or null
 */
export async function sendMatchNotification(
  userId: string,
  matchedUserId: string,
  matchPercentage: number
): Promise<{ error: Error | null }> {
  const { error } = await createNotification({
    user_id: userId,
    type: 'match',
    content: `New ${matchPercentage}% compatibility match found!`,
    actor_id: matchedUserId,
    resource_type: 'match',
    resource_id: matchedUserId,
  })

  return { error }
}

// ===========================================
// formatTimeAgo now imported from @/lib/utils/time-ago (deduplicated)
