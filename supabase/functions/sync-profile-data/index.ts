import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateAuth } from '../_shared/auth.ts'

interface SyncRequest {
  user_id: string
  fields?: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate authentication (admin only for this operation)
    await validateAuth(req, supabase)
    
    const body: SyncRequest = await req.json()
    const userId = body.user_id

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Syncing profile data for user ${userId}`)

    // Get main profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Profile fetch failed: ${profileError.message}`)
    }

    // Sync skills count
    const { count: skillsCount } = await supabase
      .from('user_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Sync interests count
    const { count: interestsCount } = await supabase
      .from('user_interests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Sync experiences count
    const { count: experiencesCount } = await supabase
      .from('user_experiences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Sync projects count
    const { count: projectsCount } = await supabase
      .from('user_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Calculate updated completion score
    const completionScore = calculateProfileCompletion({
      ...profile,
      skills_count: skillsCount || 0,
      interests_count: interestsCount || 0,
      experiences_count: experiencesCount || 0,
      projects_count: projectsCount || 0
    })

    // Update profile with calculated fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        completion_score: completionScore,
        skills_count: skillsCount || 0,
        interests_count: interestsCount || 0,
        experiences_count: experiencesCount || 0,
        projects_count: projectsCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`)
    }

    // Trigger embedding generation if profile is complete enough
    if (completionScore >= 50) {
      await supabase.functions.invoke('generate-embedding', {
        body: { record: profile }
      })
    }

    console.log(`Profile data synced successfully for user ${userId}, completion: ${completionScore}%`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        completion_score: completionScore,
        counts: {
          skills: skillsCount,
          interests: interestsCount,
          experiences: experiencesCount,
          projects: projectsCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync error:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function calculateProfileCompletion(data: Record<string, unknown>): number {
  let score = 0
  if (data.full_name) score += 15
  if (data.headline) score += 10
  if (data.bio) score += 15
  if ((data.skills_count as number) > 0) score += 25
  if ((data.interests_count as number) > 0) score += 15
  if ((data.experiences_count as number) > 0) score += 20
  return Math.min(score, 100)
}
