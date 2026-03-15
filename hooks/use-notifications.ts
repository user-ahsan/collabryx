"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as NotificationService from "@/lib/services/notifications"
import type { Notification, NotificationSummary } from "@/lib/services/notifications"

// ===========================================
// REACT QUERY KEYS
// ===========================================

export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
  summary: ["notifications", "summary"] as const,
  unread: ["notifications", "unread"] as const,
  list: ["notifications", "list"] as const,
  byId: (id: string) => [...NOTIFICATION_QUERY_KEYS.all, id] as const,
}

// ===========================================
// NOTIFICATIONS QUERY
// ===========================================

export function useNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}) {
  return useQuery<Notification[], Error>({
    queryKey: NOTIFICATION_QUERY_KEYS.list,
    queryFn: async () => {
      const { data, error } = await NotificationService.getNotifications(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60,      // 1 minute
    gcTime: 1000 * 60 * 10,    // 10 minutes
  })
}

// ===========================================
// UNREAD COUNT QUERY
// ===========================================

export function useUnreadCount() {
  return useQuery<number, Error>({
    queryKey: NOTIFICATION_QUERY_KEYS.unread,
    queryFn: async () => {
      const { count, error } = await NotificationService.getUnreadCount()
      if (error) throw error
      return count
    },
    staleTime: 1000 * 30,      // 30 seconds
    gcTime: 1000 * 60 * 5,     // 5 minutes
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

// ===========================================
// NOTIFICATION SUMMARY QUERY
// ===========================================

export function useNotificationSummary() {
  return useQuery<NotificationSummary, Error>({
    queryKey: NOTIFICATION_QUERY_KEYS.summary,
    queryFn: async () => {
      const { data, error } = await NotificationService.getNotificationSummary()
      if (error) throw error
      if (!data) throw new Error("No notification summary")
      return data
    },
    staleTime: 1000 * 60,      // 1 minute
    gcTime: 1000 * 60 * 5,     // 5 minutes
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

// ===========================================
// MARK AS READ MUTATION
// ===========================================

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NotificationService.MarkAsReadInput) =>
      NotificationService.markAsRead(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.list })

      // If marking specific notification, update it directly
      if (variables.notificationId && !variables.markAll) {
        queryClient.setQueryData<Notification[]>(
          NOTIFICATION_QUERY_KEYS.list,
          (old) =>
            old?.map((n) =>
              n.id === variables.notificationId ? { ...n, is_read: true } : n
            ) || []
        )
      }
    },
  })
}

// ===========================================
// DELETE NOTIFICATION MUTATION
// ===========================================

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.list })

      // Remove from cache
      queryClient.setQueryData<Notification[]>(
        NOTIFICATION_QUERY_KEYS.list,
        (old) => old?.filter((n) => n.id !== notificationId) || []
      )
    },
  })
}

// ===========================================
// MARK AS ACTIONED MUTATION
// ===========================================

export function useMarkAsActioned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.markAsActioned(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.list })

      // Update in cache
      queryClient.setQueryData<Notification[]>(
        NOTIFICATION_QUERY_KEYS.list,
        (old) =>
          old?.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, is_actioned: true } : n
          ) || []
      )
    },
  })
}

// ===========================================
// REALTIME SUBSCRIPTION HOOK
// ===========================================

export function useNotificationsSubscription(userId: string) {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!userId) return

    const unsubscribe = NotificationService.subscribeToNotifications(userId, {
      onInsert: (notification) => {
        // Add new notification to cache
        queryClient.setQueryData<Notification[]>(
          NOTIFICATION_QUERY_KEYS.list,
          (old) => [notification, ...(old || [])]
        )

        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread })
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.summary })
      },
      onUpdate: (notification) => {
        // Update notification in cache
        queryClient.setQueryData<Notification[]>(
          NOTIFICATION_QUERY_KEYS.list,
          (old) =>
            old?.map((n) => (n.id === notification.id ? notification : n)) || []
        )

        // Invalidate unread count if status changed
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread })
      },
      onDelete: (notificationId) => {
        // Remove from cache
        queryClient.setQueryData<Notification[]>(
          NOTIFICATION_QUERY_KEYS.list,
          (old) => old?.filter((n) => n.id !== notificationId) || []
        )

        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread })
      },
    })

    return () => {
      unsubscribe()
    }
  }, [userId, queryClient])
}

// Import React for useEffect
import React from "react"
