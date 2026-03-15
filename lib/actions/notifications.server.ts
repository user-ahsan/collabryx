'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ===========================================
// NOTIFICATIONS SERVER ACTIONS
// ===========================================

// ===========================================
// MARK NOTIFICATION AS READ
// ===========================================
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to mark notification as read' }
  }

  revalidatePath('/notifications')
  
  return { success: true }
}

// ===========================================
// MARK ALL NOTIFICATIONS AS READ
// ===========================================
export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return { error: 'Failed to mark all notifications as read' }
  }

  revalidatePath('/notifications')
  
  return { success: true }
}

// ===========================================
// DELETE NOTIFICATION
// ===========================================
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete notification' }
  }

  revalidatePath('/notifications')
  
  return { success: true }
}

// ===========================================
// DELETE ALL READ NOTIFICATIONS
// ===========================================
export async function deleteAllReadNotifications() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true)

  if (error) {
    return { error: 'Failed to delete read notifications' }
  }

  revalidatePath('/notifications')
  
  return { success: true }
}

// ===========================================
// GET UNREAD COUNT
// ===========================================
export async function getUnreadCount() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { count: count || 0 }
}
