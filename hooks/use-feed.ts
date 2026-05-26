/**
 * Feed Hook - React Query implementation
 * Provides personalized feed scoring and access to fetchPersonalizedFeed
 */

"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPersonalizedFeed, type PostsQueryOptions } from '@/lib/services/posts'
import type { PostWithAuthor } from '@/types/database.types'

export const FEED_QUERY_KEYS = {
  all: ['feed'] as const,
  personalized: () => [...FEED_QUERY_KEYS.all, 'personalized'] as const,
  chronological: () => [...FEED_QUERY_KEYS.all, 'chronological'] as const,
}

export interface FeedScoreInput {
  post_id: string
  semantic: number
  engagement_successes: number
  engagement_failures: number
  hours_old: number
  is_connected: boolean
  has_shared_interests: boolean
  intent_match: boolean
}

export interface FeedScoreResponse {
  success: boolean
  data?: {
    scored_posts: Array<{
      post_id: string
      score: number
      factors: Record<string, unknown>
    }>
    persisted: boolean
    saved_count?: number
  }
  error?: string
}

/**
 * Score posts via the feed scoring API
 * Used for client-side triggered scoring (background refinement)
 */
export async function scorePosts(
  posts: FeedScoreInput[],
  persist: boolean = false
): Promise<{ data: FeedScoreResponse['data'] | null; error: Error | null }> {
  try {
    const csrfToken = (() => {
      try {
        return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || ''
      } catch { return '' }
    })()

    const response = await fetch('/api/feed/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ posts, persist }),
    })

    const result: FeedScoreResponse = await response.json()

    if (!response.ok || !result.success) {
      return { data: null, error: new Error(result.error || 'Failed to score feed') }
    }

    return { data: result.data ?? null, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to score feed') }
  }
}

/**
 * Hook to fetch feed posts — uses personalized feed when available,
 * falls back to chronological
 */
export async function fetchFeed(options: PostsQueryOptions = {}): Promise<{
  data: PostWithAuthor[]
  error: Error | null
}> {
  // Try personalized first, falls back to chronological inside
  const personalizedResult = await fetchPersonalizedFeed(options)
  if (personalizedResult.error) {
    return { data: [], error: personalizedResult.error }
  }
  return { data: personalizedResult.data, error: null }
}

/**
 * Mutation hook for scoring feed posts
 */
export function useScoreFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ posts, persist }: { posts: FeedScoreInput[]; persist?: boolean }) =>
      scorePosts(posts, persist),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all })
      }
    },
  })
}
