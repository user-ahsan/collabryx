'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuditLogInput } from '@/types/actions'
import type { AuditEventType } from '@/lib/audit-logger'
import { 
  logAuditEvent as logAudit,
  withAudit as withAuditWrapper,
  logAuthEvent as logAuth,
  logDataModification as logDataMod,
  logProfileUpdate,
  logAdminAction,
  logFailedLogin,
} from '@/lib/audit-logger'

// ===========================================
// AUDIT LOGGING SERVER ACTIONS (P1-03)
// Backwards compatible wrappers for new audit logger
// ===========================================

/**
 * Log an audit event (legacy wrapper)
 */
export async function logAuditEvent(input: AuditLogInput) {
  return logAudit(input)
}

/**
 * With Audit wrapper - automatically logs success/failure of actions (legacy wrapper)
 */
export async function withAudit<T>(
  action: () => Promise<T>,
  eventType: string,
  userId: string
): Promise<T> {
  return withAuditWrapper(action, eventType as AuditEventType, { userId })
}

/**
 * Log authentication event
 */
export async function logAuthEvent(eventType: 'login' | 'logout' | 'password_reset' | 'signup' | 'password_change') {
  return logAuth(eventType)
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
  return logDataMod(resourceType, resourceId, action, details)
}

/**
 * Log profile update (P1-03)
 */
export async function logProfileUpdateAction(
  updatedFields: string[],
  details?: Record<string, unknown>
) {
  return logProfileUpdate(updatedFields, details)
}

/**
 * Log admin action (P1-03)
 */
export async function logAdminActionWrapper(
  actionType: string,
  targetUserId?: string,
  details?: Record<string, unknown>
) {
  return logAdminAction(actionType, targetUserId, details)
}

/**
 * Log failed login attempt (P1-03)
 */
export async function logFailedLoginAttempt(
  email: string,
  reason: string
) {
  return logFailedLogin(email, reason)
}
