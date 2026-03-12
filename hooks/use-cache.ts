"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { getCache, setCache } from "@/lib/dashboard-cache"

interface UseCacheOptions<T> {
  key: string
  fetchFn: () => Promise<{ data: T | null; error: Error | null }>
  fallbackMessage?: string
  enabled?: boolean
}

interface UseCacheReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for API → Cache → Fallback data fetching pattern
 * 
 * @example
 * ```ts
 * const { data, isLoading, error, refetch } = useCache({
 *   key: CACHE_KEYS.FEED_POSTS,
 *   fetchFn: () => fetchPosts({ limit: 20 }),
 *   fallbackMessage: "Couldn't load latest posts. Showing cached data."
 * })
 * ```
 */
export function useCache<T>({
  key,
  fetchFn,
  fallbackMessage,
  enabled = true
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await fetchFn()

      if (error) throw error

      if (data) {
        setData(data)
        setCache(key, data)
      }
    } catch (err) {
      // API failed → try cache
      const cached = getCache<T>(key)
      if (cached) {
        setData(cached)
        toast.info(fallbackMessage || "Couldn't load latest data. Showing cached version.", {
          id: `cache-fallback-${key}`,
        })
      } else {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, fetchFn, fallbackMessage, enabled])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/**
 * Simplified hook for cache-only data retrieval (no API call)
 * 
 * @example
 * ```ts
 * const cachedData = useCacheOnly(CACHE_KEYS.FEED_POSTS)
 * ```
 */
export function useCacheOnly<T>(key: string): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    const cached = getCache<T>(key)
    if (cached) {
      setData(cached)
    }
  }, [key])

  return data
}
