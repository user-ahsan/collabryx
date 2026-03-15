import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import type { Notification, WebhookPayload } from '../_shared/types.ts'

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

    // Get notification from webhook payload
    const { record }: WebhookPayload = await req.json()
    const notification: Notification = record

    console.log(`Sending notification ${notification.id} to user ${notification.user_id}`)

    // Broadcast via Supabase Realtime
    const { error: broadcastError } = await supabase.channel(`notifications:${notification.user_id}`)
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          created_at: notification.created_at
        }
      })

    if (broadcastError) {
      throw new Error(`Realtime broadcast failed: ${broadcastError.message}`)
    }

    // Update notification count cache (optional optimization)
    await supabase.rpc('increment_unread_count', {
      p_user_id: notification.user_id
    }).catch(() => {
      // Ignore if RPC doesn't exist yet
      console.log('Unread count RPC not available')
    })

    console.log(`Notification ${notification.id} sent successfully`)

    return new Response(
      JSON.stringify({ success: true, notification_id: notification.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Notification send error:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
