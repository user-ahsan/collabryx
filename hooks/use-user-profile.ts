"use client"
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error(error?.message || 'Not authenticated')
      return { id: user.id, email: user.email }
    },
    staleTime: 5 * 60 * 1000,
  })
}
