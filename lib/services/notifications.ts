import { createClient } from "@/lib/supabase/client"

// ===========================================
// NOTIFICATIONS SERVICE
// ===========================================

export interface Notification {
  id: string
  user_id: string
  type: "connect" | "message" | "like" | "comment" | "system" | "match"
  actor_id: string | null
  actor_name: string | null
  actor_avatar: string | null
  content: string
  resource_type: "post" | "profile" | "conversation" | "match" | null
  resource_id: string | null
  is_read: boolean
  is_actioned: boolean
  created_at: string
  time_ago?: string
}

export interface NotificationSummary {
  unread_count: number
  total_count: number
  notifications: Notification[]
}

export interface MarkAsReadInput {
  notificationId?: string
  markAll?: boolean
}

/**
 * Fetch user notifications with pagination
 */
export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}): Promise<{
  data: Notification[]
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
      return { data: [], error: new Error("Please log in to view notifications.") }
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq("is_read", false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    const mappedNotifications: Notification[] = (data || []).map((notif: any) => ({
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      actor_id: notif.actor_id,
      actor_name: notif.actor_name,
      actor_avatar: notif.actor_avatar,
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
    console.error("Error fetching notifications:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { count: 0, error: new Error("Authentication failed") }
    }

    if (!user) {
      return { count: 0, error: null }
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return { count: 0, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Mark notification(s) as read
 */
export async function markAsRead(input: MarkAsReadInput): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to mark notifications.") }
    }

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)

    if (input.notificationId && !input.markAll) {
      query = query.eq("id", input.notificationId)
    }

    const { error } = await query

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
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
    console.error("Error deleting notification:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Mark notification as actioned (e.g., after clicking on it)
 */
export async function markAsActioned(notificationId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to update notifications.") }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_actioned: true, is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error marking notification as actioned:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get notification summary (unread count + recent notifications)
 */
export async function getNotificationSummary(): Promise<{
  data: NotificationSummary | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in") }
    }

    // Get unread count
    const { count: unreadCount } = await getUnreadCount()

    // Get total count
    const { count: totalCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get recent notifications
    const { data: notifications } = await getNotifications({ limit: 10 })

    return {
      data: {
        unread_count: unreadCount,
        total_count: totalCount || 0,
        notifications: notifications || [],
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching notification summary:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// REALTIME SUBSCRIPTION
// ===========================================

export function subscribeToNotifications(
  userId: string,
  callbacks: {
    onInsert?: (notification: Notification) => void
    onUpdate?: (notification: Notification) => void
    onDelete?: (notificationId: string) => void
  }
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onInsert?.({
          ...(payload.new as any),
          time_ago: "Just now",
        })
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onUpdate?.({
          ...(payload.new as any),
          time_ago: formatTimeAgo(payload.new.created_at),
        })
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onDelete?.(payload.old.id)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
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
