/**
 * Match Error Types - Standardized error classification
 * Used across all match services for consistent error handling
 */
export enum MatchErrorType {
  AUTH_EXPIRED = 'AUTH_EXPIRED',           // 401, retry = reauth
  RATE_LIMITED = 'RATE_LIMITED',           // 429, retry = backoff
  VECTOR_SEARCH_TIMEOUT = 'VECTOR_TIMEOUT',// Timeout, retry = retry
  DATABASE_ERROR = 'DATABASE_ERROR',       // 500, retry = circuit
  NO_MATCHES = 'NO_MATCHES',               // 404, retry = generate
  NETWORK_ERROR = 'NETWORK_ERROR',         // Offline, retry = queue
  UNKNOWN = 'UNKNOWN',                     // Fallback
}

/**
 * Match Error - Standardized error with classification
 * Provides consistent error handling across match services
 */
export class MatchError extends Error {
  constructor(
    message: string,
    public type: MatchErrorType,
    public code?: string,
    public retryable: boolean = true,
    public recoverAt?: Date
  ) {
    super(message)
    this.name = 'MatchError'
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MatchError)
    }
  }
  
  /**
   * Create MatchError from Supabase error
   * Classifies Supabase errors into standardized types
   */
  static fromSupabaseError(error: any): MatchError {
    // Handle null/undefined
    if (!error) {
      return new MatchError('Unknown error', MatchErrorType.UNKNOWN, 'UNKNOWN', false)
    }
    
    // No matches found (PGRST116 is Supabase "not found" code)
    if (error?.code === 'PGRST116') {
      return new MatchError('No matches found', MatchErrorType.NO_MATCHES, error.code, false)
    }
    
    // Rate limited
    if (error?.code === '429' || error?.status === 429) {
      return new MatchError(
        'Rate limited',
        MatchErrorType.RATE_LIMITED,
        error.code || '429',
        true,
        new Date(Date.now() + 5000) // 5 second backoff
      )
    }
    
    // Unauthorized/Authentication expired
    if (error?.code === '401' || error?.status === 401) {
      return new MatchError(
        'Authentication expired',
        MatchErrorType.AUTH_EXPIRED,
        error.code || '401',
        true
      )
    }
    
    // Timeout errors
    if (error?.message?.includes('timeout') || error?.code === '57014') {
      return new MatchError(
        'Vector search timeout',
        MatchErrorType.VECTOR_SEARCH_TIMEOUT,
        error.code || 'TIMEOUT',
        true
      )
    }
    
    // Network errors
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return new MatchError(
        'Network error',
        MatchErrorType.NETWORK_ERROR,
        error.code || 'NETWORK',
        true
      )
    }
    
    // Database errors (default for Supabase errors)
    if (error?.code?.startsWith('PGRST') || error?.code?.startsWith('23') || error?.code?.startsWith('42')) {
      return new MatchError(
        error?.message || 'Database error',
        MatchErrorType.DATABASE_ERROR,
        error.code || 'UNKNOWN',
        false // Database errors usually need intervention
      )
    }
    
    // Fallback to unknown
    return new MatchError(
      error?.message || 'Unknown error',
      MatchErrorType.UNKNOWN,
      error?.code || 'UNKNOWN',
      false
    )
  }
  
  /**
   * Create MatchError from generic Error
   */
  static fromError(error: unknown): MatchError {
    if (error instanceof MatchError) {
      return error
    }
    
    if (error instanceof Error) {
      // Check for network errors
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new MatchError(error.message, MatchErrorType.NETWORK_ERROR, 'NETWORK', true)
      }
      
      // Check for timeout
      if (error.message.includes('timeout')) {
        return new MatchError(error.message, MatchErrorType.VECTOR_SEARCH_TIMEOUT, 'TIMEOUT', true)
      }
      
      // Default to unknown
      return new MatchError(error.message, MatchErrorType.UNKNOWN, undefined, false)
    }
    
    // Non-error object
    return new MatchError(
      String(error),
      MatchErrorType.UNKNOWN,
      undefined,
      false
    )
  }
  
  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable
  }
  
  /**
   * Get recommended retry delay in milliseconds
   */
  getRetryDelay(): number {
    switch (this.type) {
      case MatchErrorType.RATE_LIMITED:
        return 5000 // 5 seconds
      case MatchErrorType.AUTH_EXPIRED:
        return 1000 // 1 second (reauth quickly)
      case MatchErrorType.VECTOR_SEARCH_TIMEOUT:
        return 2000 // 2 seconds
      case MatchErrorType.NETWORK_ERROR:
        return 3000 // 3 seconds
      default:
        return 5000 // Default 5 seconds
    }
  }
  
  /**
   * Convert to plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      retryable: this.retryable,
      recoverAt: this.recoverAt?.toISOString(),
      stack: this.stack
    }
  }
}
