/**
 * Database Connection Manager
 * 
 * Handles Supabase connection pool exhaustion, retry logic, and circuit breaker patterns.
 * Prevents cascade failures and provides graceful degradation during high load.
 * 
 * Key Features:
 * - Automatic retry with exponential backoff for transient failures
 * - Pool exhaustion detection and fast-fail
 * - Circuit breaker integration to prevent cascade failures
 * - Query timeout enforcement
 * - Connection health monitoring
 */

import { CircuitBreaker } from '@/lib/services/circuit-breaker'
import { logger } from '@/lib/logger'

// ===========================================
// ERROR TYPES & DETECTION
// ===========================================

export enum DatabaseErrorType {
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  UNKNOWN = 'UNKNOWN',
}

export interface DatabaseError {
  type: DatabaseErrorType
  message: string
  code?: string
  retryable: boolean
  retryAfter?: number // milliseconds
}

/**
 * Classify Supabase errors to determine retry strategy
 */
export function classifyDatabaseError(error: unknown): DatabaseError {
  if (!(error instanceof Error) && typeof error !== 'object') {
    return {
      type: DatabaseErrorType.UNKNOWN,
      message: String(error),
      retryable: false,
    }
  }

  const err = error as Error & { code?: string; status?: number; cause?: unknown }
  const errorMessage = err.message?.toLowerCase() || ''
  const errorCode = err.code?.toString() || ''

  // Pool exhaustion detection
  if (
    errorMessage.includes('pool') ||
    errorMessage.includes('exhausted') ||
    errorMessage.includes('too many clients') ||
    errorMessage.includes('remaining connection slots') ||
    errorCode === '53300' // PostgreSQL too_many_connections
  ) {
    return {
      type: DatabaseErrorType.POOL_EXHAUSTED,
      message: err.message || 'Database connection pool exhausted',
      code: errorCode,
      retryable: true,
      retryAfter: 2000, // Wait 2 seconds before retry
    }
  }

  // Timeout detection
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorCode === '57014' // PostgreSQL query_canceled
  ) {
    return {
      type: DatabaseErrorType.TIMEOUT,
      message: err.message || 'Query timeout',
      code: errorCode,
      retryable: true,
      retryAfter: 1000, // Wait 1 second before retry
    }
  }

  // Rate limiting detection
  if (
    errorMessage.includes('rate limit') ||
    err.status === 429 ||
    errorCode === '429'
  ) {
    return {
      type: DatabaseErrorType.RATE_LIMITED,
      message: err.message || 'Rate limit exceeded',
      code: errorCode,
      retryable: true,
      retryAfter: 5000, // Wait 5 seconds before retry
    }
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('econnrefused')
  ) {
    return {
      type: DatabaseErrorType.NETWORK_ERROR,
      message: err.message || 'Network error',
      code: errorCode,
      retryable: true,
      retryAfter: 3000, // Wait 3 seconds before retry
    }
  }

  // Authentication errors (not retryable without re-auth)
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid token') ||
    err.status === 401 ||
    errorCode === '401'
  ) {
    return {
      type: DatabaseErrorType.AUTH_ERROR,
      message: err.message || 'Authentication failed',
      code: errorCode,
      retryable: false,
    }
  }

  // Constraint violations (not retryable)
  if (
    errorCode.startsWith('23') || // PostgreSQL constraint violations
    errorMessage.includes('constraint') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('violates')
  ) {
    return {
      type: DatabaseErrorType.CONSTRAINT_VIOLATION,
      message: err.message || 'Constraint violation',
      code: errorCode,
      retryable: false,
    }
  }

  // Unknown error
  return {
    type: DatabaseErrorType.UNKNOWN,
    message: err.message || 'Unknown database error',
    code: errorCode,
    retryable: true,
    retryAfter: 2000,
  }
}

// ===========================================
// RETRY CONFIGURATION
// ===========================================

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: DatabaseError) => boolean
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error) => error.retryable,
}

/**
 * Execute a database operation with automatic retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: DatabaseError | null = null
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const classified = classifyDatabaseError(error)
      lastError = classified

      // Log retry attempt
      if (attempt < config.maxRetries) {
        logger.db.warn('Database operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          errorType: classified.type,
          errorMessage: classified.message,
          retryAfter: classified.retryAfter,
        })

        // Check if we should retry
        if (!config.shouldRetry(classified)) {
          logger.db.error('Database operation not retryable', {
            errorType: classified.type,
            errorMessage: classified.message,
          })
          throw error
        }

        // Use error-specific retry delay if available
        const retryDelay = classified.retryAfter || delay
        await new Promise(resolve => setTimeout(resolve, retryDelay))

        // Exponential backoff for next attempt
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
      }
    }
  }

  // All retries exhausted
  logger.db.error('Database operation failed after all retries', {
    totalAttempts: config.maxRetries + 1,
    errorType: lastError?.type,
    errorMessage: lastError?.message,
  })

  throw new Error(
    `Database operation failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`
  )
}

// ===========================================
// QUERY TIMEOUT
// ===========================================

export interface TimeoutOptions {
  timeout?: number
  timeoutMessage?: string
}

const DEFAULT_TIMEOUT = 10000 // 10 seconds

/**
 * Execute a database operation with timeout protection
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const timeoutMessage = options.timeoutMessage || `Query timeout after ${timeout}ms`

  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeout)
    ),
  ])
}

// ===========================================
// CIRCUIT BREAKER INTEGRATION
// ===========================================

// Global circuit breaker for database operations
export const dbCircuitBreaker = new CircuitBreaker({
  name: 'database',
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
})

/**
 * Execute a database operation with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  if (fallback) {
    return dbCircuitBreaker.executeWithFallback(operation, fallback)
  }
  return dbCircuitBreaker.execute(operation)
}

// ===========================================
// COMBINED PROTECTION
// ===========================================

export interface ProtectedQueryOptions<T = unknown> extends RetryOptions, TimeoutOptions {
  useCircuitBreaker?: boolean
  fallback?: () => Promise<T>
  operationName?: string
}

/**
 * Execute a database operation with full protection:
 * - Circuit breaker (fail fast during outages)
 * - Timeout (prevent hanging queries)
 * - Retry with exponential backoff (handle transient failures)
 * - Error classification (smart retry decisions)
 */
export async function withDatabaseProtection<T>(
  operation: () => Promise<T>,
  options: ProtectedQueryOptions<T> = {}
): Promise<T> {
  const {
    useCircuitBreaker = true,
    fallback,
    operationName = 'database operation',
    ...retryAndTimeoutOptions
  } = options

  const wrappedOperation = async () => {
    // Apply timeout protection
    const withTimeoutProtection = () => withTimeout(operation, retryAndTimeoutOptions)
    
    // Apply retry logic
    const withRetryProtection = () => withRetry(withTimeoutProtection, retryAndTimeoutOptions)
    
    // Apply circuit breaker
    if (useCircuitBreaker) {
      return withCircuitBreaker(withRetryProtection, fallback)
    }
    
    return withRetryProtection()
  }

  try {
    return await wrappedOperation()
  } catch (error) {
    const classified = classifyDatabaseError(error)
    
    logger.db.error('Database operation failed', {
      operation: operationName,
      errorType: classified.type,
      errorMessage: classified.message,
      errorCode: classified.code,
      retryable: classified.retryable,
    })
    
    throw error
  }
}

// ===========================================
// CONNECTION HEALTH MONITORING
// ===========================================

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  circuitBreakerState: 'closed' | 'open' | 'half-open'
  lastError?: string
  lastErrorTime?: string
  consecutiveFailures: number
}

let lastError: string | undefined
let lastErrorTime: Date | undefined
let consecutiveFailures = 0

/**
 * Track database operation success/failure for health monitoring
 */
export function trackDatabaseOperation(success: boolean, error?: Error) {
  if (success) {
    consecutiveFailures = 0
    lastError = undefined
    lastErrorTime = undefined
  } else {
    consecutiveFailures++
    lastError = error?.message
    lastErrorTime = new Date()
  }
}

/**
 * Get current database connection health status
 */
export function getConnectionHealth(): ConnectionHealth {
  const circuitState = dbCircuitBreaker.getState()
  
  let status: ConnectionHealth['status'] = 'healthy'
  
  if (circuitState === 'open') {
    status = 'unhealthy'
  } else if (circuitState === 'half-open' || consecutiveFailures >= 3) {
    status = 'degraded'
  }
  
  return {
    status,
    circuitBreakerState: circuitState,
    lastError,
    lastErrorTime: lastErrorTime?.toISOString(),
    consecutiveFailures,
  }
}

// ===========================================
// HELPER: SUPABASE QUERY WRAPPER
// ===========================================

/**
 * Execute a Supabase query with full protection
 * 
 * Example usage:
 * ```typescript
 * const { data, error } = await executeProtectedQuery(
 *   () => supabase.from('posts').select('*').eq('id', postId).single(),
 *   { operationName: 'fetchPostById' }
 * )
 * ```
 */
export async function executeProtectedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: ProtectedQueryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await withDatabaseProtection(queryFn, options)
    trackDatabaseOperation(true)
    return { data: (result as { data: T | null }).data, error: null }
  } catch (error) {
    trackDatabaseOperation(false, error as Error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
