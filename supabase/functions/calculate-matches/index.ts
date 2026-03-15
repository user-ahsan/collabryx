import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateAuth } from '../_shared/auth.ts'

interface MatchRequest {
  user_id?: string
  limit?: number
  min_score?: number
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

    // Validate authentication
    const user = await validateAuth(req, supabase)
    
    // Parse request body
    const body: MatchRequest = await req.json().catch(() => ({}))
    const targetUserId = body.user_id || user.id
    const limit = body.limit || 20
    const minScore = body.min_score || 0.3

    console.log(`Calculating matches for user ${targetUserId}`)

    // Get user's embedding
    const { data: userEmbedding, error: embeddingError } = await supabase
      .from('profile_embeddings')
      .select('embedding')
      .eq('user_id', targetUserId)
      .single()

    if (embeddingError || !userEmbedding) {
      throw new Error('User embedding not found. Ensure profile is complete.')
    }

    // Calculate vector similarity match
    const { data: matches, error: matchesError } = await supabase.rpc('calculate_profile_matches', {
      p_user_id: targetUserId,
      p_limit: limit,
      p_min_score: minScore
    })

    if (matchesError) {
      console.error('Match calculation error:', matchesError)
      throw new Error(`Match calculation failed: ${matchesError.message}`)
    }

    // If no RPC exists, fallback to direct query
    if (!matches || matches.length === 0) {
      console.log('RPC not available, using direct query')
      
      const { data: directMatches } = await supabase
        .from('profile_embeddings')
        .select(`
          user_id,
          similarity: cosine_similarity(embedding, ${JSON.stringify(userEmbedding.embedding)}),
          profiles!inner (
            id,
            full_name,
            headline,
            avatar_url,
            skills,
            interests
          )
        `)
        .neq('user_id', targetUserId)
        .order('similarity', { ascending: false })
        .limit(limit)

      return new Response(
        JSON.stringify({ 
          success: true, 
          matches: directMatches || [],
          count: directMatches?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${matches.length} matches for user ${targetUserId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        matches,
        count: matches.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Match calculation error:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
