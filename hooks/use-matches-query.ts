/**
 * Matches Hook - React Query implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMatches,
  dismissMatch,
  connectWithMatch,
  fetchMatchActivity,
  markActivityRead,
  fetchMatchPreferences,
  updateMatchPreferences,
} from '@/lib/services/matches'
import { matchClient } from '@/lib/worker-client'
import { createClient } from '@/lib/supabase/client'

export const MATCH_QUERY_KEYS = {
  all: ['matches'] as const,
  lists: () => [...MATCH_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { limit?: number; minScore?: number }) => [...MATCH_QUERY_KEYS.lists(), filters] as const,
  activity: () => [...MATCH_QUERY_KEYS.all, 'activity'] as const,
  preferences: () => [...MATCH_QUERY_KEYS.all, 'preferences'] as const,
}

export function useMatches(filters?: { limit?: number; minScore?: number }) {
  const supabase = createClient()

  return useQuery({
    queryKey: MATCH_QUERY_KEYS.list(filters),
    queryFn: async () => {
      // Guard: silently skip if no session to avoid error floods
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []
      
      const { data, error } = await fetchMatches(filters)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,   // 15 minutes
    retry: false, // Don't retry auth errors — they're not transient
  })
}

export function useDismissMatch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: dismissMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.lists() })
    },
  })
}

export function useConnectWithMatch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: connectWithMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.lists() })
    },
  })
}

export function useMatchActivity() {
  return useQuery({
    queryKey: MATCH_QUERY_KEYS.activity(),
    queryFn: async () => {
      const { data, error } = await fetchMatchActivity({ limit: 5 })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,    // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}

export function useMarkActivityRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: markActivityRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.activity() })
    },
  })
}

export function useMatchPreferences() {
  return useQuery({
    queryKey: MATCH_QUERY_KEYS.preferences(),
    queryFn: async () => {
      const { data, error } = await fetchMatchPreferences()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  })
}

export function useUpdateMatchPreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateMatchPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.preferences() })
    },
  })
}

export function useGenerateMatches() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, limit }: { userId: string; limit?: number }) => {
      const csrfToken = (() => {
        try {
          return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || ''
        } catch { return '' }
      })()

      const response = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ user_id: userId, limit: limit ?? 20 }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to generate matches')
      }

      return result.data?.suggestions || []
    },
    onSuccess: (result) => {
      if (result && result.length > 0) {
        // Invalidate matches list to refresh UI
        queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.lists() })
      }
    },
  })
}

export function useGenerateBatchMatches() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userIds, limitPerUser }: { userIds?: string[]; limitPerUser?: number }) => 
      matchClient.generateBatch({ userIds: userIds || [], limitPerUser }),
    onSuccess: () => {
      // Invalidate all match queries after batch processing
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.all })
    },
  })
}

export function useCheckMatchGenerationStatus(processId?: string) {
  return useQuery({
    queryKey: ['match-generation-status', processId],
    queryFn: async () => {
      if (!processId) return null
      return { status: 'completed', message: 'Match service is now a microservice' }
    },
    enabled: !!processId,
  })
}
