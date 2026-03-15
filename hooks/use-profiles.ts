"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as ProfilesService from "@/lib/services/profiles"
import type { Profile } from "@/lib/services/profiles"

// ===========================================
// REACT QUERY KEYS
// ===========================================

export const PROFILE_QUERY_KEYS = {
  all: ["profiles"] as const,
  byId: (id: string) => [...PROFILE_QUERY_KEYS.all, id] as const,
  current: [...PROFILE_QUERY_KEYS.all, "current"] as const,
  list: [...PROFILE_QUERY_KEYS.all, "list"] as const,
  search: (query: string) => [...PROFILE_QUERY_KEYS.all, "search", query] as const,
}

// ===========================================
// CURRENT USER PROFILE
// ===========================================

export function useCurrentProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: PROFILE_QUERY_KEYS.current,
    queryFn: async () => {
      const { data, error } = await ProfilesService.getCurrentProfile()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  })
}

// ===========================================
// PROFILE BY ID
// ===========================================

export function useProfile(userId: string) {
  return useQuery<Profile | null, Error>({
    queryKey: PROFILE_QUERY_KEYS.byId(userId),
    queryFn: async () => {
      const { data, error } = await ProfilesService.getProfileById(userId)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
    enabled: !!userId,
  })
}

// ===========================================
// UPDATE PROFILE MUTATION
// ===========================================

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<Profile>) =>
      ProfilesService.updateProfile(input),
    onSuccess: (data) => {
      if (data.error) {
        console.error("Failed to update profile:", data.error)
        return
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current })
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all })

      // Update cache optimistically
      queryClient.setQueryData(PROFILE_QUERY_KEYS.current, data.data)
    },
  })
}

// ===========================================
// PROFILE COMPLETION
// ===========================================

export function useProfileCompletion() {
  const { data: profile } = useCurrentProfile()

  return {
    completion: profile?.profile_completion || 0,
    isComplete: (profile?.profile_completion || 0) >= 100,
    onboardingCompleted: profile?.onboarding_completed || false,
  }
}

// ===========================================
// PROFILES LIST (for matches, connections, etc.)
// ===========================================

export function useProfilesList(options?: {
  limit?: number
  offset?: number
  excludeUserId?: string
}) {
  return useQuery<Profile[], Error>({
    queryKey: PROFILE_QUERY_KEYS.list,
    queryFn: async () => {
      const { data, error } = await ProfilesService.getProfilesList(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 15,    // 15 minutes
  })
}

// ===========================================
// USER SEARCH
// ===========================================

export function useUserSearch(query: string) {
  return useQuery<Profile[], Error>({
    queryKey: PROFILE_QUERY_KEYS.search(query),
    queryFn: async () => {
      if (!query.trim()) return []

      const { data, error } = await ProfilesService.searchUsers(query)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,  // 2 minutes
    gcTime: 1000 * 60 * 5,     // 5 minutes
    enabled: query.trim().length > 0,
  })
}

// ===========================================
// OPTIMISTIC PROFILE UPDATE
// ===========================================

export function useOptimisticProfileUpdate() {
  const queryClient = useQueryClient()

  return {
    updateProfile: (updates: Partial<Profile>) => {
      // Update current profile in cache optimistically
      queryClient.setQueryData(PROFILE_QUERY_KEYS.current, (old: Profile | null) => {
        if (!old) return old
        return { ...old, ...updates }
      })
    },
    rollback: () => {
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current })
    },
  }
}
