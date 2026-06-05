/**
 * Notifications Hook - React Query implementation with real-time updates
 * Provides typed, cached notification data fetching
 * 
 * @module hooks/use-notifications
 */

"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  type FetchNotificationsOptions,
} from '@/lib/services/notifications'

// ===========================================
// QUERY KEYS
// ===========================================

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (options?: FetchNotificationsOptions) => [...NOTIFICATION_QUERY_KEYS.all, 'list', options] as const,
  unread: () => [...NOTIFICATION_QUERY_KEYS.all, 'unread'] as const,
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Fetch notifications with caching
 * 
 * @param options - Optional limit and unread_only filter
 * 
 * @example
 * ```tsx
 * const { data: notifications } = useNotifications({ limit: 10, unread_only: true })
 * ```
 */
export function useNotifications(options?: FetchNotificationsOptions) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(options),
    queryFn: async () => {
      const { data, error } = await fetchNotifications(options)
      if (error) {
        // "Not authenticated" is a normal state during page transitions
        if (error.message !== "Not authenticated") {
          console.error('[useNotifications] Fetch error:', error.message)
        }
        throw error
      }
      return data
    },
    staleTime: 1000 * 60 * 2,  // 2 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
    retry: 1,
  })
}

/**
 * Get unread notification count with real-time updates
 * 
 * @example
 * ```tsx
 * const { data: unreadCount } = useUnreadCount()
 * ```
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unread(),
    queryFn: async () => {
      const { count, error } = await getUnreadCount()
      if (error) {
        // "Not authenticated" is a normal state during page transitions / auth load
        // Don't log as error — just return 0 gracefully
        if (error.message === "Not authenticated") {
          return 0
        }
        console.error('[useUnreadCount] Fetch error:', error.message)
        throw error
      }
      return count
    },
    staleTime: 1000 * 15,   // 15 seconds — fast refresh for @mention notifications
    gcTime: 1000 * 60 * 5,  // 5 minutes
    retry: 1,
  })
}

/**
 * Mark notification as read mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: markAsRead } = useMarkNotificationAsRead()
 * markAsRead(notificationId)
 * ```
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await markNotificationAsRead(notificationId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
    },
  })
}

/**
 * Mark all notifications as read mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead()
 * markAllAsRead()
 * ```
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await markAllNotificationsAsRead()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
    },
  })
}

/**
 * Delete notification mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: deleteNotification } = useDeleteNotification()
 * deleteNotification(notificationId)
 * ```
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await deleteNotification(notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
    },
  })
}

/**
 * Real-time notification subscription hook
 * Automatically listens for new notifications via Supabase Realtime
 * Falls back to polling if WebSocket is unavailable
 * 
 * @example
 * ```tsx
 * useRealtimeNotifications()
 * // New notifications will automatically appear
 * ```
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    /** Polling fallback: invalidate notification queries on an interval */
    const startPolling = () => {
      if (pollInterval) return
      pollInterval = setInterval(() => {
        if (!isMounted) return
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread() })
      }, 30_000) // Poll every 30 seconds
    }

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    const setup = async () => {
      // Check WebSocket availability
      if (typeof window !== 'undefined' && !window.WebSocket) {
        console.warn('[useRealtimeNotifications] WebSocket not available in this browser — falling back to polling')
        startPolling()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted || !user) return

      channel = supabase
        .channel('notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread() })
          }
        )
        .subscribe((status) => {
          if (!isMounted) return

          if (status === 'SUBSCRIBED') {
            // Connected via WebSocket — stop any polling fallback
            stopPolling()
            console.debug('[useRealtimeNotifications] Realtime channel subscribed')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[useRealtimeNotifications] Realtime channel ${status} — falling back to polling`)
            // Fall back to polling when WebSocket fails
            startPolling()
          }
        })
    }

    setup().catch((err) => {
      console.error('[useRealtimeNotifications] Failed to set up channel:', err)
      // Start polling fallback on any setup error
      startPolling()
    })

    return () => {
      isMounted = false
      stopPolling()
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (cleanupErr) {
          console.error('[useRealtimeNotifications] Error removing channel:', cleanupErr)
        }
        channel = null
      }
    }
  }, [queryClient])
}
