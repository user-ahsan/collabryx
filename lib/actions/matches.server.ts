'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { withAudit } from './audit.server'
import { z } from 'zod'

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

const MatchIdSchema = z.string().uuid('Invalid match ID')
const LimitSchema = z.number().int().min(1).max(100).default(20)

// ===========================================
// MATCHES SERVER ACTIONS
// ===========================================

// ===========================================
// ACCEPT MATCH
// ===========================================
export async function acceptMatch(matchId: string) {
  const supabase = await createClient()
  
  // Zod validation
  const idValidation = MatchIdSchema.safeParse(matchId)
  if (!idValidation.success) {
    return { error: 'Invalid match ID' }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify match exists and belongs to user
  const { data: match, error: fetchError } = await supabase
    .from('match_suggestions')
    .select('matched_user_id')
    .eq('id', matchId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !match) {
    return { error: 'Match not found' }
  }

  await withAudit(
    async () => {
      // Atomic RPC call: updates match_suggestions status, creates connections,
      // inserts notification, and records match activity atomically.
      const { error: rpcError } = await supabase
        .rpc('accept_match', {
          p_match_id: matchId,
          p_user_id: user.id,
        })

      if (rpcError) throw rpcError
      
      return { success: true }
    },
    'match_accept',
    user.id
  )

  revalidatePath('/matches')
  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// DISMISS MATCH
// ===========================================
export async function dismissMatch(matchId: string) {
  const supabase = await createClient()
  
  // Zod validation
  const idValidation = MatchIdSchema.safeParse(matchId)
  if (!idValidation.success) {
    return { error: 'Invalid match ID' }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('match_suggestions')
    .update({ status: 'dismissed' })
    .eq('id', matchId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to dismiss match' }
  }

  revalidatePath('/matches')
  
  return { success: true }
}

// ===========================================
// UPDATE MATCH PREFERENCES
// ===========================================

const MatchPreferencesSchema = z.object({
  min_match_percentage: z.number().int().min(0).max(100).optional(),
  interested_in_types: z.array(z.string()).optional(),
  availability_match: z.enum(['any', 'similar', 'complementary']).optional(),
  role_matching_enabled: z.boolean().optional(),
})

export async function updateMatchPreferences(preferences: {
  min_match_percentage?: number
  interested_in_types?: string[]
  availability_match?: 'any' | 'similar' | 'complementary'
  role_matching_enabled?: boolean
}) {
  const supabase = await createClient()
  
  // Zod validation
  const validation = MatchPreferencesSchema.safeParse(preferences)
  if (!validation.success) {
    return { error: 'Invalid match preferences' }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('match_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: 'Failed to update preferences' }
  }

  revalidatePath('/matches')
  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// GET MATCH SUGGESTIONS
// ===========================================
export async function getMatchSuggestions(limit = 20) {
  const supabase = await createClient()
  
  // Zod validation
  const limitValidation = LimitSchema.safeParse(limit)
  if (!limitValidation.success) {
    return { error: 'Invalid limit parameter' }
  }
  const validLimit = limitValidation.data

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('match_suggestions')
    // FIX: The original code had PostgREST join comments INSIDE the template literal
    // that contained BACKTICK characters (`` `match_suggestions` ``). In JavaScript,
    // backticks inside a template literal END the string prematurely. TypeScript saw
    // `` `match_suggestions` `` as closing the outer `.select()` backtick and then
    // parsing the rest as raw syntax, producing TS1005 errors at multiple positions.
    // The fix removes the comments entirely (they were not SQL comments — `//` inside
    // a template literal is literal text, not a comment marker). The PostgREST join
    // syntax (`matched_user:profiles!fkey!inner`) is preserved and works correctly
    // without explanatory text.
    .select(`
      id,
      user_id,
      matched_user_id,
      match_percentage,
      reasons,
      ai_confidence,
      ai_explanation,
      status,
      created_at,
      expires_at,
      matched_user:profiles!match_suggestions_matched_user_id_fkey!inner (
        id,
        display_name,
        full_name,
        avatar_url,
        headline
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('match_percentage', { ascending: false })
    .limit(validLimit)

  if (error) {
    return { error: 'Failed to fetch matches' }
  }

  return { data }
}
