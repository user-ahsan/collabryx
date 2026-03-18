'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'
import { generateUserEmbedding } from '@/lib/services/embeddings'
import { TOAST_MESSAGES } from '@/lib/constants/toast-messages'
import { toast } from 'sonner'

// ===========================================
// PROFILE HOOK
// ===========================================

export const PROFILE_QUERY_KEYS = {
  all: ['profiles'] as const,
  byId: (id: string) => [...PROFILE_QUERY_KEYS.all, id] as const,
  current: () => [...PROFILE_QUERY_KEYS.all, 'current'] as const,
}

interface ProfileWithRelations extends Profile {
  user_skills?: Array<{ id: string; skill: string; created_at?: string }>
  user_interests?: Array<{ id: string; interest: string; created_at?: string }>
  user_experiences?: Array<{ id: string; title: string; company?: string; description?: string; start_date?: string; end_date?: string; created_at?: string }>
}

export function useProfile(userId?: string) {
  const supabase = createClient()
  const queryKey = userId ? PROFILE_QUERY_KEYS.byId(userId) : PROFILE_QUERY_KEYS.current()

  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_skills (*),
          user_interests (*),
          user_experiences (*)
        `)
        
      if (userId) {
        query = query.eq('id', userId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        query = query.eq('id', user.id)
      }

      const { data, error } = await query.single()
      
      if (error) throw error
      return data as ProfileWithRelations
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// ===========================================
// UPDATE PROFILE HOOK
// ===========================================

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current() })
      
      // Trigger embedding generation after successful profile update
      if (data && 'id' in data) {
        try {
          const result = await generateUserEmbedding(data.id)
          
          if (!result.success && result.error === 'RateLimitError') {
            // Show rate limit warning but don't block profile update
            toast.warning(TOAST_MESSAGES.RATE_LIMIT.EMBEDDING.EXCEEDED, {
              description: result.retryAfter 
                ? TOAST_MESSAGES.RATE_LIMIT.EMBEDDING.RETRY_AFTER(Math.ceil(result.retryAfter / 60))
                : undefined,
              duration: 5000,
            })
          } else if (!result.success) {
            // Log embedding failure but don't show error to user (profile update succeeded)
            console.warn('Embedding generation failed after profile update:', result.error)
          } else {
            // Success - show info toast
            toast.info('Profile updated', {
              description: 'Your profile embedding is being refreshed for better matches.',
              duration: 3000,
            })
          }
        } catch (error) {
          // Silently handle embedding errors (don't block profile update)
          console.error('Failed to trigger embedding after profile update:', error)
        }
      }
    },
  })
}

// ===========================================
// PROFILE COMPLETION HOOK
// ===========================================

export function useProfileCompletion() {
  const { data: profile, isLoading } = useProfile()

  const completion = calculateProfileCompletion(profile ?? null)

  return {
    completion,
    isLoading,
    isComplete: completion === 100,
    missingFields: getMissingFields(profile ?? null),
  }
}

function calculateProfileCompletion(profile: ProfileWithRelations | null): number {
  if (!profile) return 0

  let score = 0
  
  // Basic profile (25%)
  if (profile.full_name || profile.display_name) score += 10
  if (profile.headline) score += 10
  if (profile.bio) score += 5

  // Skills (25%)
  if (profile.user_skills && profile.user_skills.length > 0) score += 25

  // Interests & Goals (25%)
  if (profile.user_interests && profile.user_interests.length > 0) score += 15
  if (profile.looking_for && profile.looking_for.length > 0) score += 10

  // Experience (25%)
  if (profile.user_experiences && profile.user_experiences.length > 0) score += 25

  return Math.min(score, 100)
}

function getMissingFields(profile: ProfileWithRelations | null): string[] {
  const missing: string[] = []

  if (!profile) return ['profile']

  if (!profile.full_name && !profile.display_name) missing.push('name')
  if (!profile.headline) missing.push('headline')
  if (!profile.bio) missing.push('bio')
  if (!profile.user_skills?.length) missing.push('skills')
  if (!profile.user_interests?.length) missing.push('interests')
  if (!profile.looking_for?.length) missing.push('goals')
  if (!profile.user_experiences?.length) missing.push('experience')

  return missing
}
