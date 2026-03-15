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

// Module-specific logger
const log = logger.app

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  type: z.enum(['connect', 'message', 'like', 'comment', 'system', 'match']),
  content: z.string().min(1).max(500),
  actor_id: z.string().uuid().optional(),
  resource_type: z.enum(['post', 'profile', 'conversation', 'match']).optional(),
  resource_id: z.string().uuid().optional(),
})

// ===========================================
// TYPES
// ===========================================

export interface NotificationWithActor extends Notification {
  actor_name?: string
  actor_avatar?: string
  time_ago: string
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    let query = supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles (
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

    if (error) throw error

    const mappedNotifications: NotificationWithActor[] = (notifications || []).map((notif) => ({
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      actor_id: notif.actor_id,
      actor_name: notif.actor?.display_name || notif.actor?.full_name,
      actor_avatar: notif.actor?.avatar_url,
      content: notif.content,
      resource_type: notif.resource_type,
      resource_id: notif.resource_id,
      is_read: notif.is_read,
      is_actioned: notif.is_actioned,
      created_at: notif.created_at,
      time_ago: formatTimeAgo(notif.created_at),
    }))

    return { data: mappedNotifications, error: null }
  } catch (error) {
    log.error("Error fetching notifications:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("Unknown error fetching notifications") 
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
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error marking notification as read:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error marking notification as read") 
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
    return { error: error instanceof Error ? error : new Error("Unknown error marking all notifications as read") }
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
    return { error: error instanceof Error ? error : new Error("Unknown error deleting notification") }
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
    return { error: error instanceof Error ? error : new Error("Unknown error deleting all notifications") }
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
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    log.error("Error getting unread count:", error)
    return { count: 0, error: error instanceof Error ? error : new Error("Unknown error getting unread count") }
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
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error creating notification:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error creating notification") 
    }
  }
}

/**
 * Send connection request notification (helper)
 * 
 * @param receiverId - User receiving the notification
 * @param requesterId - User who sent the request
 * @returns Error or null
 */
export async function sendConnectionRequestNotification(
  receiverId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  const { error } = await createNotification({
    user_id: receiverId,
    type: 'connect',
    content: 'You have a new connection request',
    actor_id: requesterId,
    resource_type: 'profile',
    resource_id: requesterId,
  })

  return { error }
}

/**
 * Send connection accepted notification (helper)
 * 
 * @param receiverId - User receiving the notification
 * @param accepterId - User who accepted
 * @returns Error or null
 */
export async function sendConnectionAcceptedNotification(
  receiverId: string,
  accepterId: string
): Promise<{ error: Error | null }> {
  const { error } = await createNotification({
    user_id: receiverId,
    type: 'connect',
    content: 'Your connection request was accepted',
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
 * @returns Error or null
 */
export async function sendCommentNotification(
  postAuthorId: string,
  commenterId: string,
  postId: string
): Promise<{ error: Error | null }> {
  const { error } = await createNotification({
    user_id: postAuthorId,
    type: 'comment',
    content: 'Someone commented on your post',
    actor_id: commenterId,
    resource_type: 'post',
    resource_id: postId,
  })

  return { error }
}

/**
 * Send like notification (helper)
 * 
 * @param receiverId - User receiving the notification
 * @param likerId - User who liked
 * @param postId - Post ID (optional)
 * @returns Error or null
 */
export async function sendLikeNotification(
  receiverId: string,
  likerId: string,
  postId?: string
): Promise<{ error: Error | null }> {
  const { error } = await createNotification({
    user_id: receiverId,
    type: 'like',
    content: 'Someone liked your content',
    actor_id: likerId,
    resource_type: postId ? 'post' : 'profile',
    resource_id: postId || likerId,
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
    content: `You have a ${matchPercentage}% match with someone!`,
    actor_id: matchedUserId,
    resource_type: 'match',
    resource_id: matchedUserId,
  })

  return { error }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Format timestamp to relative time string
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
