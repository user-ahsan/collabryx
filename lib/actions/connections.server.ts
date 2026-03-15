'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ===========================================
// CONNECTIONS SERVER ACTIONS
// ===========================================

// ===========================================
// SEND CONNECTION REQUEST
// ===========================================
export async function sendConnectionRequest(targetUserId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  if (targetUserId === user.id) {
    return { error: 'Cannot send request to yourself' }
  }

  // Check if already connected or request exists
  const { data: existing } = await supabase
    .from('connections')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},connected_to.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_to.eq.${user.id})`)
    .single()

  if (existing) {
    return { error: 'Connection already exists or request pending' }
  }

  const { data: request, error } = await supabase
    .from('connections')
    .insert({
      user_id: user.id,
      connected_to: targetUserId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to send connection request:', error)
    return { error: 'Failed to send connection request' }
  }

  // Create notification for the recipient
  await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      type: 'connection_request',
      title: 'New Connection Request',
      content: `${user.id} wants to connect with you`,
      action_url: `/requests`,
    })

  revalidatePath('/requests')
  revalidatePath(`/profile/${targetUserId}`)
  
  return { data: request }
}

// ===========================================
// ACCEPT CONNECTION REQUEST
// ===========================================
export async function acceptConnectionRequest(requestId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data: request } = await supabase
    .from('connections')
    .select('user_id, connected_to')
    .eq('id', requestId)
    .eq('connected_to', user.id)
    .single()

  if (!request) {
    return { error: 'Request not found' }
  }

  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', requestId)

  if (error) {
    return { error: 'Failed to accept request' }
  }

  // Create notification for the sender
  await supabase
    .from('notifications')
    .insert({
      user_id: request.user_id,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      content: `${user.id} accepted your connection request`,
      action_url: `/profile/${user.id}`,
    })

  revalidatePath('/requests')
  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// DECLINE CONNECTION REQUEST
// ===========================================
export async function declineConnectionRequest(requestId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', requestId)
    .eq('connected_to', user.id)

  if (error) {
    return { error: 'Failed to decline request' }
  }

  revalidatePath('/requests')
  
  return { success: true }
}

// ===========================================
// REMOVE CONNECTION
// ===========================================
export async function removeConnection(userId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .or(`and(user_id.eq.${user.id},connected_to.eq.${userId}),and(user_id.eq.${userId},connected_to.eq.${user.id})`)

  if (error) {
    return { error: 'Failed to remove connection' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/profile/${userId}`)
  
  return { success: true }
}

// ===========================================
// CANCEL CONNECTION REQUEST
// ===========================================
export async function cancelConnectionRequest(requestId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', requestId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to cancel request' }
  }

  revalidatePath('/requests')
  
  return { success: true }
}
