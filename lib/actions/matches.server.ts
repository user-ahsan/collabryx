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
      // Track operations for rollback on failure
      const operations: { type: string; id?: string }[] = []

      // 1. Update match status
      const { error: updateError } = await supabase
        .from('match_suggestions')
        .update({ status: 'connected' })
        .eq('id', matchId)

      if (updateError) throw updateError
      operations.push({ type: 'match_update', id: matchId })

      // 2. Create connection
      const { data: connectionData, error: connectionError } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: match.matched_user_id,
          status: 'accepted',
        })
        .select('id')
        .single()

      if (connectionError) throw connectionError
      operations.push({ type: 'connection_create', id: connectionData.id })

      // 3. Create notification for the matched user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: match.matched_user_id,
          type: 'match_accepted',
          content: `${user.id} accepted your match suggestion`,
        })

      if (notifError) throw notifError
      operations.push({ type: 'notification_create' })

      // 4. Record match activity
      const { error: activityError } = await supabase
        .from('match_activity')
        .insert({
          actor_user_id: user.id,
          target_user_id: match.matched_user_id,
          type: 'building_match',
          activity: 'Connected via match suggestion',
        })

      if (activityError) throw activityError
      operations.push({ type: 'activity_create' })
      
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
})

export async function updateMatchPreferences(preferences: {
  min_match_percentage?: number
  interested_in_types?: string[]
  availability_match?: 'any' | 'similar' | 'complementary'
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
      matched_user:profiles!inner (
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
