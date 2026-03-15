/**
 * Notifications Hook - React Query implementation with real-time updates
 * Provides typed, cached notification data fetching
 * 
 * @module hooks/use-notifications
 */

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
      if (error) throw error
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
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unread(),
    queryFn: async () => {
      const { count, error } = await getUnreadCount()
      if (error) throw error
      return count
    },
    staleTime: 1000 * 60,  // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
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
    const supabase = createClient()
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
