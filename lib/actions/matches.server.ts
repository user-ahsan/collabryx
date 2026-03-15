'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { withAudit } from './audit.server'

// ===========================================
// MATCHES SERVER ACTIONS
// ===========================================

// ===========================================
// ACCEPT MATCH
// ===========================================
export async function acceptMatch(matchId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify match exists and belongs to user
  const { data: match } = await supabase
    .from('match_suggestions')
    .select('matched_user_id')
    .eq('id', matchId)
    .eq('user_id', user.id)
    .single()

  if (!match) {
    return { error: 'Match not found' }
  }

  await withAudit(
    async () => {
      // Update match status
      const { error } = await supabase
        .from('match_suggestions')
        .update({ status: 'connected' })
        .eq('id', matchId)

      if (error) throw error

      // Create connection
      await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          connected_to: match.matched_user_id,
          status: 'accepted',
        })

      // Create notification for the matched user
      await supabase
        .from('notifications')
        .insert({
          user_id: match.matched_user_id,
          type: 'match_accepted',
          title: 'Match Accepted!',
          content: `${user.id} accepted your match suggestion`,
          action_url: `/profile/${user.id}`,
        })

      // Record match activity
      await supabase
        .from('match_activity')
        .insert({
          user_id: user.id,
          matched_user_id: match.matched_user_id,
          activity_type: 'accepted',
        })
      
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
export async function updateMatchPreferences(preferences: {
  looking_for?: string[]
  location?: string
  skills?: string[]
  min_match_percentage?: number
}) {
  const supabase = await createClient()
  
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
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('match_suggestions')
    .select(`
      *,
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
    .limit(limit)

  if (error) {
    return { error: 'Failed to fetch matches' }
  }

  return { data }
}
