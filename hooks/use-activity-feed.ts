/**
 * Activity Feed Hook - React Query implementation
 * Provides typed, cached activity feed data fetching
 * 
 * @module hooks/use-activity-feed
 */

"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ===========================================
// TYPES
// ===========================================

export interface ActivityFeedItem {
  id: string
  type: 'profile_view' | 'building_match' | 'skill_match'
  activity: string
  match_percentage?: number
  created_at: string
  is_read: boolean
  actor: {
    id: string
    name: string
    avatar: string | null
    headline: string | null
  }
}

export interface ActivityFeedResponse {
  data: ActivityFeedItem[]
  count: number
  hasMore: boolean
}

export interface FetchActivityFeedOptions {
  limit?: number
  offset?: number
}

// ===========================================
// QUERY KEYS
// ===========================================

export const ACTIVITY_QUERY_KEYS = {
  all: ['activity-feed'] as const,
  list: (options?: FetchActivityFeedOptions) => [...ACTIVITY_QUERY_KEYS.all, 'list', options] as const,
  unread: () => [...ACTIVITY_QUERY_KEYS.all, 'unread'] as const,
}

// ===========================================
// API FUNCTIONS
// ===========================================

export async function fetchActivityFeed(
  options?: FetchActivityFeedOptions
): Promise<{ data: ActivityFeedResponse; error: Error | null }> {
  try {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())

    const response = await fetch(`/api/activity/feed?${params.toString()}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch activity feed')
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return { 
      data: { data: [], count: 0, hasMore: false }, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    }
  }
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Fetch activity feed with caching
 * 
 * @param options - Optional limit and offset for pagination
 * 
 * @example
 * ```tsx
 * const { data: feed, isLoading } = useActivityFeed({ limit: 20 })
 * ```
 */
export function useActivityFeed(options?: FetchActivityFeedOptions) {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.list(options),
    queryFn: async () => {
      const { data, error } = await fetchActivityFeed(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,  // 2 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
    retry: 1,
  })
}

/**
 * Real-time activity feed subscription hook
 * Automatically listens for new activities via Supabase Realtime
 * 
 * @example
 * ```tsx
 * useRealtimeActivityFeed()
 * // New activities will automatically appear
 * ```
 */
export function useRealtimeActivityFeed() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('match_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_activity',
        },
        () => {
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
