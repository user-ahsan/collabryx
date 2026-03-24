'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  updateProfile: (data: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch current user
  const { data: userData, error: userError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Fetch user profile
  const { data: profile, error: profileError, isLoading, refetch } = useQuery({
    queryKey: ['profile', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!userData?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (!userData?.id) throw new Error('No user ID')
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userData.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const error = userError || profileError || updateProfileMutation.error

  return {
    user: userData ?? null,
    profile: profile ?? null,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error : null,
    updateProfile: async (data: Partial<Profile>) => {
      await updateProfileMutation.mutateAsync(data)
    },
    refreshProfile: async () => {
      await refetch()
    },
  }
}
