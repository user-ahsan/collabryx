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

export function useLoginData() {
  const [isReady, setIsReady] = useState(false)

  // Fetch posts
  const postsQuery = useQuery({
    queryKey: ['feed-initial'],
    queryFn: async () => {
      const result = await fetchPosts({ limit: 20 })
      return result.data || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    enabled: false, // Manually trigger
  })

  // Fetch matches
  const matchesQuery = useQuery({
    queryKey: ['matches-initial'],
    queryFn: async () => {
      const result = await fetchMatches({ limit: 20 })
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,   // 15 minutes
    enabled: false, // Manually trigger
  })

  // Fetch profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      return data
    },
    staleTime: 1000 * 60 * 5,
    enabled: false,
  })

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)
      
      return data || []
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    enabled: false,
  })

  // Trigger all queries on mount
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
      } catch (error) {
        console.error('Error fetching login data:', error)
      }
    }

    fetchAllData()
  }, [])

  return {
    isReady,
    posts: postsQuery.data || [],
    matches: matchesQuery.data || [],
    profile: profileQuery.data,
    notifications: notificationsQuery.data || [],
    isLoading: postsQuery.isLoading || matchesQuery.isLoading || profileQuery.isLoading,
    error: postsQuery.error || matchesQuery.error || profileQuery.error,
  }
}
