/**
 * Notification Sending Hook - React Query mutation for sending notifications
 * 
 * Provides mutation for sending notifications via Python worker
 */

"use client"

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TOAST_MESSAGES, TOAST_DURATION } from '@/lib/constants/toast-messages'
import type { Notification } from '@/types/database.types'

// ===========================================
// TYPES
// ===========================================

export type NotificationType = Notification['type']

export interface SendNotificationRequest {
  user_id: string
  type: NotificationType
  content: string
  actor_id?: string
  actor_name?: string
  actor_avatar?: string
  resource_type?: 'post' | 'profile' | 'conversation' | 'match'
  resource_id?: string
}

export interface SendNotificationResponse {
  success: boolean
  message?: string
  data?: {
    notification_id: string
    user_id: string
    type: string
    status: "queued" | "sent" | "failed"
    backend_mode: string
  }
  error?: string
  circuit_breaker_state?: string
}

// ===========================================
// API FUNCTION
// ===========================================

/**
 * Send a notification to a user
 * 
 * @param data - Notification data
 * @returns Send notification response
 */
export async function sendNotification(
  data: SendNotificationRequest
): Promise<{
  data: SendNotificationResponse | null
  error: Error | null
}> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '',
      },
      body: JSON.stringify(data),
    })

    const result: SendNotificationResponse = await response.json()

    if (!response.ok || !result.success) {
      return {
        data: null,
        error: new Error(result.error || result.message || 'Failed to send notification'),
      }
    }

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to send notification'),
    }
  }
}

// ===========================================
// HOOK
// ===========================================

/**
 * Mutation hook for sending notifications
 * Shows toast notifications for feedback
 * 
 * @example
 * ```tsx
 * const { mutate: sendNotification } = useSendNotification()
 * 
 * sendNotification({
 *   user_id: 'user-123',
 *   type: 'connect',
 *   content: 'You have a new connection request',
 *   actor_id: 'user-456',
 * })
 * ```
 */
export function useSendNotification() {
  return useMutation({
    mutationFn: sendNotification,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(TOAST_MESSAGES.ERROR('send notification'), {
          duration: TOAST_DURATION.MEDIUM,
        })
        return
      }

      toast.success(TOAST_MESSAGES.SENT, {
        description: 'Notification sent successfully',
        duration: TOAST_DURATION.SHORT,
      })
    },
    onError: (error) => {
      toast.error(TOAST_MESSAGES.ERROR('send notification'), {
        description: error.message,
        duration: TOAST_DURATION.MEDIUM,
      })
    },
  })
}
