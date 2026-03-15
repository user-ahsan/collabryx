import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import type { Profile, WebhookPayload } from '../_shared/types.ts'

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

    // Get profile from webhook payload
    const { record, type }: WebhookPayload = await req.json()
    
    // Validate profile completion
    const completionScore = calculateProfileCompletion(record)
    if (completionScore < 50) {
      console.log(`Profile ${record.id} completion score ${completionScore}% - below threshold`)
      return new Response(
        JSON.stringify({ success: false, reason: 'Profile incomplete', completionScore }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check rate limit
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from('embedding_rate_limits')
      .select('requests_count, reset_at')
      .eq('user_id', record.id)
      .maybeSingle()

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError)
    }

    if (rateLimit && rateLimit.requests_count >= 10) {
      // Queue for later
      await supabase.from('embedding_pending_queue').insert({
        user_id: record.id,
        status: 'pending',
        profile_data: record
      })
      console.log(`Profile ${record.id} queued due to rate limit`)
      return new Response(
        JSON.stringify({ success: true, queued: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Python worker
    const workerUrl = Deno.env.get('PYTHON_WORKER_URL') || 'http://host.docker.internal:8000'
    const response = await fetch(`${workerUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: record.id,
        profile_data: record
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Python worker failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    
    // Update rate limit
    await supabase.rpc('increment_embedding_rate_limit', {
      p_user_id: record.id
    })

    console.log(`Embedding generated successfully for profile ${record.id}`)

    return new Response(
      JSON.stringify({ success: true, embedding: result.embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Embedding generation error:', error)
    
    // Add to dead letter queue
    const { error: dlqError } = await supabase.from('embedding_dead_letter_queue').insert({
      user_id: record.id,
      error_message: error.message,
      retry_count: 0,
      profile_data: record
    })

    if (dlqError) {
      console.error('Failed to add to dead letter queue:', dlqError)
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function calculateProfileCompletion(profile: Profile): number {
  let score = 0
  if (profile.full_name) score += 15
  if (profile.headline) score += 10
  if (profile.bio) score += 15
  if (profile.skills && profile.skills.length > 0) score += 25
  if (profile.interests && profile.interests.length > 0) score += 15
  if (profile.experiences && profile.experiences.length > 0) score += 20
  return Math.min(score, 100)
}
