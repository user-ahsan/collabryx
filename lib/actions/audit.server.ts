'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuditLogInput } from '@/types/actions'

// ===========================================
// AUDIT LOGGING SERVER ACTIONS
// ===========================================

/**
 * Log an audit event
 */
export async function logAuditEvent(input: AuditLogInput) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action: input.action,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      details: input.details,
      ip_address: null, // Would need to be passed from request context
      user_agent: null,
    })

  if (error) {
    console.error('Failed to log audit event:', error)
    return { error: 'Failed to log audit event' }
  }

  return { success: true }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(eventType: 'login' | 'logout' | 'password_reset' | 'signup') {
  return logAuditEvent({
    action: `auth_${eventType}`,
    resource_type: 'authentication',
  })
}

/**
 * Log data modification event
 */
export async function logDataModification(
  resourceType: string,
  resourceId: string,
  action: 'create' | 'update' | 'delete',
  details?: Record<string, unknown>
) {
  return logAuditEvent({
    action: `data_${action}`,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })
}
