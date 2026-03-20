/**
 * Query Cache Utilities
 * 
 * Centralized cache configuration and utilities for React Query
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query"

/**
 * Default cache configuration for all queries
 * Optimized for balance between freshness and performance
 */
export const QUERY_CACHE_CONFIG = {
  // Time before data is considered stale (refetch on background)
  staleTime: 1000 * 60 * 5, // 5 minutes
  
  // Time before inactive data is garbage collected
  gcTime: 1000 * 60 * 30, // 30 minutes (default in v5)
  
  // Number of failed attempts before giving up
  retry: 3,
  
  // Delay between retries (exponential backoff)
  retryDelay: (attemptIndex: number) => {
    return Math.min(1000 * 2 ** attemptIndex, 10000) // 1s, 2s, 4s, max 10s
  },
  
  // Refetch on window focus (can be annoying, set to false for better UX)
  refetchOnWindowFocus: false,
  
  // Refetch when reconnecting to network
  refetchOnReconnect: true,
}

/**
 * Query-specific cache configurations
 * Use these for fine-tuning individual query types
 */
export const QUERY_PRESETS = {
  // Real-time data (notifications, messages)
  realtime: {
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  },
  
  // User data (profiles, settings)
  user: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  },
  
  // Content data (posts, matches)
  content: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 3,
  },
  
  // Analytics data (can be stale)
  analytics: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  },
  
  // Static data (config, settings)
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    retry: 1,
  },
  
  // Mutations (writes)
  mutation: {
    retry: 2,
    retryDelay: 1000,
  },
} as const

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: QUERY_CACHE_CONFIG,
      mutations: QUERY_PRESETS.mutation,
    },
  })
}

/**
 * Prefetch query data (useful for anticipated navigation)
 */
export async function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: staleTime ?? QUERY_CACHE_CONFIG.staleTime,
  })
}

/**
 * Prefetch multiple queries in parallel
 */
export async function prefetchQueries(
  queryClient: QueryClient,
  queries: Array<{
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
    staleTime?: number
  }>
): Promise<void> {
  await Promise.all(
    queries.map(({ queryKey, queryFn, staleTime }) =>
      prefetchQuery(queryClient, queryKey, queryFn, staleTime)
    )
  )
}

/**
 * Invalidate queries by pattern
 */
export function invalidateQueries(
  queryClient: QueryClient,
  patterns: Array<readonly unknown[]>
): void {
  patterns.forEach((pattern) => {
    queryClient.invalidateQueries({ queryKey: pattern })
  })
}

/**
 * Remove queries from cache (force refetch next time)
 */
export function removeQueries(
  queryClient: QueryClient,
  patterns: Array<readonly unknown[]>
): void {
  patterns.forEach((pattern) => {
    queryClient.removeQueries({ queryKey: pattern })
  })
}

/**
 * Set query data directly (optimistic updates)
 */
export function setQueryData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (oldData: T | undefined) => T
): void {
  queryClient.setQueryData(queryKey, updater)
}

/**
 * Get query data from cache (without triggering fetch)
 */
export function getQueryData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): T | undefined {
  return queryClient.getQueryData(queryKey) as T | undefined
}

/**
 * Check if query is fetching
 */
export function isQueryFetching(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): boolean {
  const state = queryClient.getQueryState(queryKey)
  return state?.fetchStatus === "fetching"
}

/**
 * Check if query is stale
 */
export function isQueryStale(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): boolean {
  const state = queryClient.getQueryState(queryKey)
  // Check if data exists and if staleTime has passed
  if (!state?.dataUpdatedAt) return true
  return Date.now() - state.dataUpdatedAt > QUERY_CACHE_CONFIG.staleTime
}

/**
 * Cancel ongoing query
 */
export function cancelQuery(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): Promise<void> {
  return queryClient.cancelQueries({ queryKey })
}

/**
 * Reset query to initial state
 */
export function resetQuery(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): Promise<void> {
  return queryClient.resetQueries({ queryKey })
}

/**
 * Cache key helpers for consistent key generation
 */
export const CACHE_KEYS = {
  // Entity types
  users: {
    all: ["users"] as const,
    list: () => ["users", "list"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    current: () => ["users", "current"] as const,
  },
  
  posts: {
    all: ["posts"] as const,
    list: (filters?: Record<string, unknown>) => ["posts", "list", filters] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
  },
  
  matches: {
    all: ["matches"] as const,
    list: (filters?: Record<string, unknown>) => ["matches", "list", filters] as const,
    detail: (id: string) => ["matches", "detail", id] as const,
    activity: () => ["matches", "activity"] as const,
  },
  
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) => ["notifications", "list", filters] as const,
    unread: () => ["notifications", "unread"] as const,
  },
  
  messages: {
    all: ["messages"] as const,
    list: (conversationId?: string) => ["messages", "list", conversationId ?? "all"] as const,
    conversations: () => ["messages", "conversations"] as const,
  },
  
  settings: {
    all: ["settings"] as const,
    profile: () => ["settings", "profile"] as const,
    preferences: () => ["settings", "preferences"] as const,
    privacy: () => ["settings", "privacy"] as const,
  },
}

/**
 * Type for cache key inference
 */
export type CacheKey = typeof CACHE_KEYS

/**
 * Default query options factory
 */
export function createQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  preset?: keyof typeof QUERY_PRESETS
) {
  const config = preset ? QUERY_PRESETS[preset] : QUERY_CACHE_CONFIG
  
  return {
    queryKey,
    queryFn,
    ...config,
  }
}

/**
 * Infinite query options factory
 */
export function createInfiniteQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: (pageParam: number) => Promise<{ data: T[]; nextCursor?: number }>,
  initialPageParam = 0
) {
  return {
    queryKey,
    queryFn,
    initialPageParam,
    ...QUERY_CACHE_CONFIG,
    getNextPageParam: (lastPage: { nextCursor?: number }) => lastPage.nextCursor,
  }
}
