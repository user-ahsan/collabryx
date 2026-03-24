/**
 * Audit Logger for Security Compliance (P1-03)
 * Tracks sensitive operations for security auditing
 */

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// ===========================================
// AUDIT EVENT TYPES
// ===========================================

export type AuditEventType =
  // Authentication events
  | 'auth_login'
  | 'auth_logout'
  | 'auth_signup'
  | 'auth_password_reset'
  | 'auth_password_change'
  | 'auth_email_verification'
  
  // Profile events
  | 'profile_update'
  | 'profile_delete'
  | 'profile_picture_upload'
  
  // Data events
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  
  // Post events
  | 'post_create'
  | 'post_update'
  | 'post_delete'
  | 'post_archive'
  
  // Connection events
  | 'connection_request'
  | 'connection_accept'
  | 'connection_reject'
  | 'connection_remove'
  
  // Message events
  | 'message_send'
  | 'message_delete'
  
  // Admin events
  | 'admin_user_ban'
  | 'admin_user_unban'
  | 'admin_content_moderate'
  | 'admin_settings_change'

export interface AuditLogInput {
  action: AuditEventType | string
  resource_type?: string
  resource_id?: string
  details?: Record<string, unknown>
  userId?: string  // Optional, will use current user if not provided
}

export interface AuditLogResult {
  success: boolean
  logId?: string
  error?: string
}

// ===========================================
// CLIENT IP DETECTION
// ===========================================

/**
 * Get client IP address from headers
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers()
    
    // Check various headers for client IP
    const ipHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip',
      'true-client-ip',
      'x-client-ip',
    ]
    
    for (const header of ipHeaders) {
      const value = headersList.get(header)
      if (value) {
        // x-forwarded-for can contain multiple IPs, take the first one
        const ip = value.split(',')[0].trim()
        if (ip) {
          return ip
        }
      }
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Get user agent from headers
 */
export async function getUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers()
    return headersList.get('user-agent')
  } catch {
    return null
  }
}

// ===========================================
// AUDIT LOGGING
// ===========================================

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(input: AuditLogInput): Promise<AuditLogResult> {
  try {
    const supabase = await createClient()
    
    // Get user ID from input or current session
    let userId = input.userId
    
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    
    if (!userId) {
      // Log anonymously if no user (for failed login attempts, etc.)
      console.warn('Audit log created without user ID:', input.action)
    }
    
    // Get request context
    const ipAddress = getClientIp()
    const userAgent = getUserAgent()
    
    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: input.action,
        resource_type: input.resource_type || null,
        resource_id: input.resource_id || null,
        details: input.details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Failed to log audit event:', error)
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      logId: data?.id,
    }
  } catch {
    console.error('Audit logging failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Wrapper for auditing sensitive operations
 * Automatically logs success/failure
 */
export async function withAudit<T>(
  action: () => Promise<T>,
  eventType: AuditEventType,
  options: {
    resourceType?: string
    resourceId?: string
    userId?: string
    details?: Record<string, unknown>
  } = {}
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await action()
    
    // Log success
    await logAuditEvent({
      action: eventType,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      details: {
        success: true,
        duration_ms: Date.now() - startTime,
        ...options.details,
      },
      userId: options.userId,
    })
    
    return result
  } catch {
    // Log failure
    await logAuditEvent({
      action: `${eventType}_failed`,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      details: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
        ...options.details,
      },
      userId: options.userId,
    })
    
    throw error
  }
}

// ===========================================
// CONVENIENCE LOGGERS
// ===========================================

/**
 * Log authentication event
 */
export async function logAuthEvent(
  eventType: 'login' | 'logout' | 'password_reset' | 'signup' | 'password_change',
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAuditEvent({
    action: `auth_${eventType}`,
    resource_type: 'authentication',
    details,
  })
}

/**
 * Log profile update
 */
export async function logProfileUpdate(
  updatedFields: string[],
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAuditEvent({
    action: 'profile_update',
    resource_type: 'profile',
    details: {
      updated_fields: updatedFields,
      ...details,
    },
  })
}

/**
 * Log data modification
 */
export async function logDataModification(
  resourceType: string,
  resourceId: string,
  action: 'create' | 'update' | 'delete',
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAuditEvent({
    action: `data_${action}`,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })
}

/**
 * Log admin action
 */
export async function logAdminAction(
  actionType: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<AuditLogResult> {
  return logAuditEvent({
    action: `admin_${actionType}`,
    resource_type: 'admin_action',
    resource_id: targetUserId,
    details,
  })
}

/**
 * Log failed login attempt (security monitoring)
 */
export async function logFailedLogin(
  email: string,
  reason: string
): Promise<AuditLogResult> {
  return logAuditEvent({
    action: 'auth_login_failed',
    resource_type: 'authentication',
    details: {
      email,
      reason,
      failed_at: new Date().toISOString(),
    },
  })
}

// ===========================================
// AUDIT QUERY HELPERS
// ===========================================

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    limit?: number
    offset?: number
    action?: string
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<AuditLogResult & { logs?: unknown[] }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    if (options.action) {
      query = query.eq('action', options.action)
    }
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }
    
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, logs: data }
  } catch {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get recent failed login attempts for monitoring
 */
export async function getFailedLoginAttempts(
  options: {
    limit?: number
    since?: Date
  } = {}
): Promise<AuditLogResult & { logs?: unknown[] }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'auth_login_failed')
      .order('created_at', { ascending: false })
      .limit(options.limit || 100)
    
    if (options.since) {
      query = query.gte('created_at', options.since.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, logs: data }
  } catch {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
