/**
 * Activity Tracking Hooks - React Query mutations and queries for activity tracking
 * 
 * Provides mutations for tracking profile views and match building events,
 * plus query for fetching activity feed
 */

"use client"

import { useMutation, useQuery } from '@tanstack/react-query'

// ===========================================
// TYPES
// ===========================================

export type ActivityType = 'profile_view' | 'building_match' | 'skill_match'

export interface TrackProfileViewRequest {
  viewed_user_id: string
}

export interface TrackMatchBuildRequest {
  matched_user_id: string
  action: 'like' | 'pass' | 'super-like'
}

export interface ActivityFeedOptions {
  limit?: number
  offset?: number
  activity_type?: 'all' | 'profile_view' | 'building_match' | 'skill_match'
}

export interface ActivityFeedItem {
  id: string
  actor_user_id: string
  target_user_id: string
  type: ActivityType
  activity: string
  match_percentage?: number
  is_read: boolean
  created_at: string
  actor_name?: string
  actor_avatar?: string
  target_name?: string
  target_avatar?: string
}

export interface TrackProfileViewResponse {
  success: boolean
  message?: string
  data?: {
    activity_id: string
    viewer_id: string
    viewed_user_id: string
    timestamp: string
    backend_mode: string
  }
  error?: string
  circuit_breaker_state?: string
}

export interface TrackMatchBuildResponse {
  success: boolean
  message?: string
  data?: {
    activity_id: string
    user_id: string
    matched_user_id: string
    action: 'like' | 'pass' | 'super-like'
    timestamp: string
    backend_mode: string
  }
  error?: string
  circuit_breaker_state?: string
}

export interface ActivityFeedResponse {
  success: boolean
  message?: string
  data?: {
    items: ActivityFeedItem[]
    total_count: number
    has_more: boolean
    limit: number
    offset: number
    backend_mode: string
  }
  error?: string
  circuit_breaker_state?: string
}

// ===========================================
// QUERY KEYS
// ===========================================

export const ACTIVITY_QUERY_KEYS = {
  all: ['activity'] as const,
  feed: (options?: ActivityFeedOptions) => [...ACTIVITY_QUERY_KEYS.all, 'feed', options] as const,
}

// ===========================================
// API FUNCTIONS
// ===========================================

/**
 * Track a profile view
 * 
 * @param data - Profile view data
 * @returns Track profile view response
 */
export async function trackProfileView(
  data: TrackProfileViewRequest
): Promise<{
  data: TrackProfileViewResponse | null
  error: Error | null
}> {
  try {
    const response = await fetch('/api/activity/track/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '',
      },
      body: JSON.stringify(data),
    })

    const result: TrackProfileViewResponse = await response.json()

    if (!response.ok || !result.success) {
      return {
        data: null,
        error: new Error(result.error || result.message || 'Failed to track profile view'),
      }
    }

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to track profile view'),
    }
  }
}

/**
 * Track match building action
 * 
 * @param data - Match build data
 * @returns Track match build response
 */
export async function trackMatchBuild(
  data: TrackMatchBuildRequest
): Promise<{
  data: TrackMatchBuildResponse | null
  error: Error | null
}> {
  try {
    const response = await fetch('/api/activity/track/build', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '',
      },
      body: JSON.stringify(data),
    })

    const result: TrackMatchBuildResponse = await response.json()

    if (!response.ok || !result.success) {
      return {
        data: null,
        error: new Error(result.error || result.message || 'Failed to track match action'),
      }
    }

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to track match action'),
    }
  }
}

/**
 * Fetch activity feed
 * 
 * @param options - Feed options (limit, offset, activity_type)
 * @returns Activity feed response
 */
export async function fetchActivityFeed(
  options?: ActivityFeedOptions
): Promise<{
  data: ActivityFeedResponse | null
  error: Error | null
}> {
  try {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())
    if (options?.activity_type && options.activity_type !== 'all') {
      params.set('activity_type', options.activity_type)
    }

    const response = await fetch(`/api/activity/feed?${params.toString()}`)

    const result: ActivityFeedResponse = await response.json()

    if (!response.ok || !result.success) {
      return {
        data: null,
        error: new Error(result.error || result.message || 'Failed to fetch activity feed'),
      }
    }

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch activity feed'),
    }
  }
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Mutation hook for tracking profile views
 * Silent tracking (no toast on success)
 * 
 * @example
 * ```tsx
 * const { mutate: trackProfileView } = useTrackProfileView()
 * 
 * trackProfileView({ viewed_user_id: 'user-123' })
 * ```
 */
export function useTrackProfileView() {
  return useMutation({
    mutationFn: trackProfileView,
    onSuccess: (result) => {
      // Silent tracking - no toast on success
      if (result.error) {
        // Only show error toast if it's not a rate limit or expected error
        console.warn('Profile view tracking failed:', result.error.message)
      }
    },
  })
}

/**
 * Mutation hook for tracking match building actions
 * Silent tracking (no toast on success)
 * 
 * @example
 * ```tsx
 * const { mutate: trackMatchBuild } = useTrackMatchBuild()
 * 
 * trackMatchBuild({ matched_user_id: 'user-123', action: 'like' })
 * ```
 */
export function useTrackMatchBuild() {
  return useMutation({
    mutationFn: trackMatchBuild,
    onSuccess: (result) => {
      // Silent tracking - no toast on success
      if (result.error) {
        console.warn('Match build tracking failed:', result.error.message)
      }
    },
  })
}

/**
 * Query hook for fetching activity feed
 * 
 * @param options - Feed options
 * 
 * @example
 * ```tsx
 * const { data: activityFeed, isLoading } = useActivityFeed({ limit: 20 })
 * ```
 */
export function useActivityFeed(options?: ActivityFeedOptions) {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.feed(options),
    queryFn: async () => {
      const { data, error } = await fetchActivityFeed(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,    // 5 minutes
    retry: 1,
  })
}
