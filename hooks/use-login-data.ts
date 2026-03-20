/**
 * Login Data Hook
 * Fetches all initial data when user logs in:
 * - Feed posts
 * - Smart matches
 * - Notifications
 * - User profile
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { fetchPosts } from '@/lib/services/posts'
import { fetchMatches } from '@/lib/services/matches'

export interface LoginData {
  posts: ReturnType<typeof fetchPosts>
  matches: ReturnType<typeof fetchMatches>
  profile: { id: string; [key: string]: unknown } | null
  notifications: { id: string; [key: string]: unknown }[]
}

interface RetryConfig {
  attempts: number
  delay: number
  backoff: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  delay: 1000,
  backoff: 2,
}

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < config.attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < config.attempts - 1) {
        const delay = config.delay * Math.pow(config.backoff, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Unknown error')
}

export function useLoginData() {
  const [isReady, setIsReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch posts
  const postsQuery = useQuery({
    queryKey: ['feed-initial'],
    queryFn: async () => {
      const result = await retry(() => fetchPosts({ limit: 20 }))
      return result.data || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000),
    enabled: false, // Manually trigger
  })

  // Fetch matches
  const matchesQuery = useQuery({
    queryKey: ['matches-initial'],
    queryFn: async () => {
      const result = await retry(() => fetchMatches({ limit: 20 }))
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,   // 15 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000),
    enabled: false, // Manually trigger
  })

  // Fetch profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return null
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching profile:', error)
          return null
        }
        
        return data
      } catch (error) {
        console.error('Profile query failed:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000),
    enabled: false,
  })

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return []
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          console.error('Error fetching notifications:', error)
          return []
        }
        
        return data || []
      } catch (error) {
        console.error('Notifications query failed:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000),
    enabled: false,
  })

  // Trigger all queries on mount with retry logic
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          postsQuery.refetch(),
          matchesQuery.refetch(),
          profileQuery.refetch(),
          notificationsQuery.refetch(),
        ])
        setIsReady(true)
        setRetryCount(0)
      } catch (error) {
        console.error('Error fetching login data:', error)
        // Retry once after 2 seconds
        if (retryCount < 1) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 2000)
        }
      }
    }

    fetchAllData()
  }, [postsQuery, matchesQuery, profileQuery, notificationsQuery, retryCount])

  return {
    isReady,
    posts: postsQuery.data || [],
    matches: matchesQuery.data || [],
    profile: profileQuery.data,
    notifications: notificationsQuery.data || [],
    isLoading: postsQuery.isLoading || matchesQuery.isLoading || profileQuery.isLoading,
    error: postsQuery.error || matchesQuery.error || profileQuery.error,
    refetch: async () => {
      try {
        setIsReady(false)
        await Promise.all([
          postsQuery.refetch(),
          matchesQuery.refetch(),
          profileQuery.refetch(),
          notificationsQuery.refetch(),
        ])
        setIsReady(true)
      } catch (error) {
        console.error('Error refetching login data:', error)
        setIsReady(false)
        throw error
      }
    },
  }
}
