/**
 * Session Configuration (P1-04)
 * Session timeout: 7 days (reduced from 30 days for security)
 */

// ===========================================
// SESSION CONFIGURATION
// ===========================================

/**
 * Session duration in seconds
 * 7 days = 604800 seconds
 * Previously: 30 days = 2592000 seconds
 */
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60 // 604800 seconds

/**
 * Session expiry warning threshold
 * Warn users when session expires in less than 24 hours
 */
export const SESSION_WARNING_THRESHOLD_SECONDS = 24 * 60 * 60 // 86400 seconds (24 hours)

/**
 * Session refresh interval
 * Check session expiry every 5 minutes
 */
export const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 300000 ms (5 minutes)

// ===========================================
// SUPABASE AUTH CONFIGURATION
// ===========================================

/**
 * Supabase Auth Configuration
 * 
 * IMPORTANT: These settings must be configured in Supabase Dashboard:
 * 1. Go to Authentication > Settings
 * 2. Update "Session Duration" to 604800 (7 days)
 * 3. Enable "Auto Confirm" for email if needed
 * 
 * SQL to run in Supabase SQL Editor:
 * 
 * ```sql
 * -- Update session duration to 7 days
 * ALTER DATABASE postgres SET "auth.session_duration" = '604800';
 * 
 * -- Or via Supabase Dashboard API:
 * -- POST /v1/config/auth
 * -- { "session_duration": 604800 }
 * ```
 */
export const SUPABASE_AUTH_CONFIG = {
  // Session duration: 7 days (in seconds)
  sessionDuration: SESSION_DURATION_SECONDS,
  
  // Enable PKCE flow for better security
  flowType: 'pkce',
  
  // Auto refresh tokens before expiry
  autoRefreshToken: true,
  
  // Detect session changes
  detectSessionInUrl: true,
  
  // Storage key prefix
  storageKey: 'supabase.auth.token',
}

// ===========================================
// SESSION EXPIRY HELPERS
// ===========================================

/**
 * Check if session is expiring soon
 */
export function isSessionExpiringSoon(expiresAt: Date | null, thresholdSeconds: number = SESSION_WARNING_THRESHOLD_SECONDS): boolean {
  if (!expiresAt) return false
  
  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  
  return timeUntilExpiry < (thresholdSeconds * 1000)
}

/**
 * Check if session has expired
 */
export function isSessionExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  
  const now = new Date()
  return expiresAt.getTime() < now.getTime()
}

/**
 * Get time until session expiry
 */
export function getTimeUntilExpiry(expiresAt: Date | null): {
  expired: boolean
  expiringSoon: boolean
  hoursRemaining: number
  minutesRemaining: number
} {
  if (!expiresAt) {
    return {
      expired: true,
      expiringSoon: false,
      hoursRemaining: 0,
      minutesRemaining: 0,
    }
  }
  
  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  
  if (timeUntilExpiry <= 0) {
    return {
      expired: true,
      expiringSoon: false,
      hoursRemaining: 0,
      minutesRemaining: 0,
    }
  }
  
  const hoursRemaining = Math.floor(timeUntilExpiry / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60))
  
  return {
    expired: false,
    expiringSoon: isSessionExpiringSoon(expiresAt),
    hoursRemaining,
    minutesRemaining,
  }
}

/**
 * Format session expiry message for UI
 */
export function formatSessionExpiryMessage(expiresAt: Date | null): string {
  if (!expiresAt) {
    return 'Session expired'
  }
  
  const { expired, expiringSoon, hoursRemaining, minutesRemaining } = getTimeUntilExpiry(expiresAt)
  
  if (expired) {
    return 'Session expired'
  }
  
  if (expiringSoon) {
    if (hoursRemaining === 0) {
      return `Session expires in ${minutesRemaining} minutes`
    }
    return `Session expires in ${hoursRemaining}h ${minutesRemaining}m`
  }
  
  if (hoursRemaining >= 24) {
    const days = Math.floor(hoursRemaining / 24)
    return `Session expires in ${days} day${days > 1 ? 's' : ''}`
  }
  
  return `Session expires in ${hoursRemaining}h ${minutesRemaining}m`
}

// ===========================================
// SESSION REFRESH
// ===========================================

/**
 * Supabase client interface for session refresh
 */
interface SupabaseAuthClient {
  auth: {
    getSession: () => Promise<{ data: { session: { expires_at?: number } | null }; error?: unknown }>
    refreshSession: () => Promise<{ error?: { message: string } | null }>
  }
}

/**
 * Refresh session if expiring soon
 * Call this periodically in authenticated pages
 * 
 * @param supabase - Supabase client instance
 * @returns Object with refresh status and expiry information
 * @throws {Error} If session refresh fails
 */
export async function refreshSessionIfNeeded(supabase: SupabaseAuthClient): Promise<{
  refreshed: boolean
  expired: boolean
  error?: string
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { refreshed: false, expired: true }
    }
    
    const expiresAt = new Date(session.expires_at! * 1000)
    
    // Check if already expired
    if (isSessionExpired(expiresAt)) {
      return { refreshed: false, expired: true }
    }
    
    // Check if expiring soon
    if (isSessionExpiringSoon(expiresAt)) {
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        return { refreshed: false, expired: false, error: error.message }
      }
      
      return { refreshed: true, expired: false }
    }
    
    return { refreshed: false, expired: false }
  } catch {
    return {
      refreshed: false,
      expired: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ===========================================
// SESSION MIDDLEWARE HELPER
// ===========================================

/**
 * Session middleware configuration
 * Add this to middleware.ts to enforce session timeout
 */
export const sessionMiddlewareConfig = {
  // Cookie name for session tracking
  cookieName: 'auth-token',
  
  // Cookie options
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  },
}
