/**
 * Match Generation Hook - React Query mutation for generating matches
 * 
 * Provides mutation for triggering match generation via Python worker
 */

"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MATCH_QUERY_KEYS } from './use-matches-query'
import { TOAST_MESSAGES, TOAST_DURATION } from '@/lib/constants/toast-messages'

// ===========================================
// TYPES
// ===========================================

export interface MatchGenerationRequest {
  user_id?: string
  limit?: number
  min_score?: number
}

export interface MatchGenerationResponse {
  success: boolean
  message?: string
  data?: {
    user_id: string
    matches_generated: number
    status: "queued" | "processing" | "completed" | "failed"
    backend_mode: string
    suggestions?: Array<{
      matched_user_id: string
      match_percentage: number
      reasons: string[]
      ai_confidence?: number
    }>
  }
  error?: string
  circuit_breaker_state?: string
}

// ===========================================
// API FUNCTION
// ===========================================

/**
 * Generate matches for the current user
 * 
 * @param data - Generation parameters
 * @returns Match generation response
 */
export async function generateMatches(
  data: MatchGenerationRequest
): Promise<{
  data: MatchGenerationResponse | null
  error: Error | null
}> {
  try {
    const response = await fetch('/api/matches/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '',
      },
      body: JSON.stringify({
        limit: data.limit ?? 20,
        min_score: data.min_score ?? 50,
      }),
    })

    const result: MatchGenerationResponse = await response.json()

    if (!response.ok || !result.success) {
      return {
        data: null,
        error: new Error(result.error || result.message || 'Failed to generate matches'),
      }
    }

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to generate matches'),
    }
  }
}

// ===========================================
// HOOK
// ===========================================

/**
 * Mutation hook for generating matches
 * Invalidates matches query on success
 * Shows toast notifications for feedback
 * 
 * @example
 * ```tsx
 * const { mutate: generateMatches, isPending: isGenerating } = useGenerateMatches()
 * 
 * generateMatches({ limit: 20, min_score: 50 }, {
 *   onSuccess: (data) => {
 *     console.log(`Generated ${data.matches_generated} matches`)
 *   }
 * })
 * ```
 */
export function useGenerateMatches() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateMatches,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(TOAST_MESSAGES.ERROR('generate matches'), {
          duration: TOAST_DURATION.MEDIUM,
        })
        return
      }

      const matchesCount = result.data?.data?.matches_generated ?? 0
      
      toast.success(TOAST_MESSAGES.SUCCESS('Match generation'), {
        description: `Generated ${matchesCount} match${matchesCount !== 1 ? 'es' : ''}`,
        duration: TOAST_DURATION.MEDIUM,
      })

      // Invalidate matches queries to refresh the list
      queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.all })
    },
    onError: (error) => {
      toast.error(TOAST_MESSAGES.ERROR('generate matches'), {
        description: error.message,
        duration: TOAST_DURATION.LONG,
      })
    },
  })
}
