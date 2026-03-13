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

export const MATCH_QUERY_KEYS = {
  all: ['matches'] as const,
  lists: () => [...MATCH_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { limit?: number; minScore?: number }) => [...MATCH_QUERY_KEYS.lists(), filters] as const,
  activity: () => [...MATCH_QUERY_KEYS.all, 'activity'] as const,
  preferences: () => [...MATCH_QUERY_KEYS.all, 'preferences'] as const,
}

export function useMatches(filters?: { limit?: number; minScore?: number }) {
  return useQuery({
    queryKey: MATCH_QUERY_KEYS.list(filters),
    queryFn: async () => {
      const { data, error } = await fetchMatches(filters)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,   // 15 minutes
    retry: 1,
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
      const { data, error } = await fetchMatchActivity()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 1,
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
