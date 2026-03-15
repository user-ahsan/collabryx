import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateAuth } from '../_shared/auth.ts'

interface CleanupConfig {
  dry_run?: boolean
  days_old?: number
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

    // Validate authentication (admin only)
    await validateAuth(req, supabase)
    
    const body: CleanupConfig = await req.json().catch(() => ({}))
    const dryRun = body.dry_run ?? false
    const daysOld = body.days_old ?? 30

    console.log(`Starting cleanup (dry_run: ${dryRun}, days_old: ${daysOld})`)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    const cutoffISOString = cutoffDate.toISOString()

    const results: Record<string, number | boolean> = {
      deleted_notifications: 0,
      archived_sessions: 0,
      cleaned_logs: 0,
      dry_run: dryRun
    }

    // Clean up old read notifications (older than 30 days)
    const { data: oldNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('id')
      .eq('read', true)
      .lt('created_at', cutoffISOString)

    if (!notifError && oldNotifications) {
      results.deleted_notifications = oldNotifications.length
      if (!dryRun) {
        await supabase
          .from('notifications')
          .delete()
          .eq('read', true)
          .lt('created_at', cutoffISOString)
      }
      console.log(`Found ${oldNotifications.length} old read notifications`)
    }

    // Archive old AI mentor sessions (older than 90 days)
    const { data: oldSessions } = await supabase
      .from('ai_mentor_sessions')
      .select('id')
      .lt('created_at', cutoffISOString)

    if (oldSessions) {
      results.archived_sessions = oldSessions.length
      if (!dryRun) {
        // Mark as archived instead of deleting
        await supabase
          .from('ai_mentor_sessions')
          .update({ is_archived: true })
          .lt('created_at', cutoffISOString)
      }
      console.log(`Found ${oldSessions.length} old sessions to archive`)
    }

    // Clean up dead letter queue entries older than 7 days (already processed)
    const { data: oldDLQ } = await supabase
      .from('embedding_dead_letter_queue')
      .select('id')
      .eq('status', 'processed')
      .lt('created_at', cutoffISOString)

    if (oldDLQ) {
      results.cleaned_dlq = oldDLQ.length
      if (!dryRun) {
        await supabase
          .from('embedding_dead_letter_queue')
          .delete()
          .eq('status', 'processed')
          .lt('created_at', cutoffISOString)
      }
      console.log(`Found ${oldDLQ.length} processed DLQ entries`)
    }

    // Clean up rate limit entries older than 1 day
    const { data: oldRateLimits } = await supabase
      .from('embedding_rate_limits')
      .select('id')
      .lt('reset_at', new Date().toISOString())

    if (oldRateLimits) {
      results.cleaned_rate_limits = oldRateLimits.length
      if (!dryRun) {
        await supabase
          .from('embedding_rate_limits')
          .delete()
          .lt('reset_at', new Date().toISOString())
      }
      console.log(`Found ${oldRateLimits.length} expired rate limit entries`)
    }

    console.log('Cleanup completed', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        cutoff_date: cutoffISOString
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Cleanup error:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
