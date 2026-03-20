/**
 * Request Timeout Utilities
 * 
 * Implements AbortController-based timeouts for all fetch calls
 * Provides standardized timeout handling across the application
 */

// ===========================================
// TIMEOUT CONFIGURATION
// ===========================================

/**
 * Default timeout durations (in milliseconds)
 */
export const TIMEOUT_CONFIG = {
  // API requests
  DEFAULT: 30000,           // 30 seconds - default for most requests
  SHORT: 10000,             // 10 seconds - quick operations
  MEDIUM: 30000,            // 30 seconds - standard API calls
  LONG: 60000,              // 60 seconds - complex operations
  VERY_LONG: 120000,        // 2 minutes - heavy processing
  
  // Python worker requests
  WORKER_DEFAULT: 30000,    // 30 seconds - worker API calls
  WORKER_EMBEDDING: 60000,  // 60 seconds - embedding generation
  WORKER_MATCH: 45000,      // 45 seconds - match generation
  WORKER_AI: 30000,         // 30 seconds - AI mentor
  
  // External services
  EXTERNAL_SHORT: 5000,     // 5 seconds - health checks
  EXTERNAL_DEFAULT: 15000,  // 15 seconds - external APIs
} as const

// ===========================================
// TIMEOUT ERROR CLASS
// ===========================================

/**
 * Custom error for timeout failures
 */
export class TimeoutError extends Error {
  public readonly timeout: number
  public readonly operation: string
  
  constructor(timeout: number, operation: string = "Request") {
    super(`${operation} timed out after ${timeout}ms`)
    this.name = "TimeoutError"
    this.timeout = timeout
    this.operation = operation
  }
}

// ===========================================
// ABORT CONTROLLER UTILITIES
// ===========================================

/**
 * Create an AbortController with automatic timeout
 * 
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @param operation - Optional operation name for error messages
 * @returns Object with AbortController and cleanup function
 * 
 * @example
 * const { controller, cleanup } = createTimeoutController(30000, "Fetch users")
 * try {
 *   const response = await fetch(url, { signal: controller.signal })
 * } finally {
 *   cleanup()
 * }
 */
export function createTimeoutController(
  timeoutMs: number = TIMEOUT_CONFIG.DEFAULT,
  operation: string = "Request"
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new TimeoutError(timeoutMs, operation))
  }, timeoutMs)
  
  const cleanup = () => {
    clearTimeout(timeoutId)
  }
  
  return {
    controller,
    cleanup,
    signal: controller.signal,
  }
}

/**
 * Execute a fetch request with timeout
 * 
 * @param url - URL to fetch
 * @param options - Fetch options (signal will be overridden)
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Operation name for error messages
 * @returns Fetch response
 * 
 * @example
 * const response = await fetchWithTimeout('/api/users', { method: 'POST', body }, 30000)
 */
export async function fetchWithTimeout(
  url: string | URL | globalThis.Request,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_CONFIG.DEFAULT,
  operation: string = "Fetch request"
): Promise<Response> {
  const { controller, cleanup } = createTimeoutController(timeoutMs, operation)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw error
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(timeoutMs, operation)
    }
    throw error
  } finally {
    cleanup()
  }
}

/**
 * Execute any async operation with timeout
 * 
 * @param operation - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name for error messages
 * @returns Result of the operation
 * 
 * @example
 * const result = await withTimeout(() => heavyComputation(), 5000, "Heavy computation")
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = TIMEOUT_CONFIG.DEFAULT,
  operationName: string = "Operation"
): Promise<T> {
  const { controller, cleanup } = createTimeoutController(timeoutMs, operationName)
  
  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(controller.signal.reason)
        })
      }),
    ])
    return result
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw error
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(timeoutMs, operationName)
    }
    throw error
  } finally {
    cleanup()
  }
}

// ===========================================
// RETRY WITH TIMEOUT
// ===========================================

export interface RetryConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  timeoutMs?: number
  retryOn?: (error: Error) => boolean
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeoutMs: TIMEOUT_CONFIG.DEFAULT,
  retryOn: (error) => {
    // Retry on network errors, timeouts, and 5xx errors
    return (
      error instanceof TimeoutError ||
      error.message.includes("network") ||
      error.message.includes("fetch")
    )
  },
}

/**
 * Execute operation with retry logic and timeout
 * 
 * @param operation - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the operation
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, timeoutMs, retryOn } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  }
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation, timeoutMs, `Attempt ${attempt + 1}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry if we've exhausted retries or shouldn't retry on this error
      if (attempt >= maxRetries || !retryOn(lastError)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Operation failed after retries")
}

// ===========================================
// FETCH WRAPPER WITH TIMEOUT
// ===========================================

export interface TimedFetchOptions extends RequestInit {
  timeoutMs?: number
  operation?: string
  retries?: number
}

/**
 * Enhanced fetch with built-in timeout and retry support
 */
export async function timedFetch(
  url: string | URL | globalThis.Request,
  options: TimedFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = TIMEOUT_CONFIG.DEFAULT, operation = "Fetch", retries = 0, ...fetchOptions } = options
  
  const doFetch = async () => fetchWithTimeout(url, fetchOptions, timeoutMs, operation)
  
  if (retries > 0) {
    return retryWithTimeout(doFetch, {
      maxRetries: retries,
      timeoutMs,
    })
  }
  
  return doFetch()
}

// ===========================================
// MIDDLEWARE FOR NEXT.JS API ROUTES
// ===========================================

import { NextRequest, NextResponse } from "next/server"

/**
 * Add timeout headers to response
 */
export function addTimeoutHeaders(response: NextResponse, timeoutMs: number) {
  response.headers.set("X-Request-Timeout", timeoutMs.toString())
  response.headers.set("X-Request-Timing", Date.now().toString())
  return response
}

/**
 * Check if request has exceeded timeout
 */
export function checkRequestTimeout(request: NextRequest, maxAge: number = TIMEOUT_CONFIG.DEFAULT): boolean {
  const startTime = request.headers.get("x-request-start")
  if (!startTime) return false
  
  const elapsed = Date.now() - parseInt(startTime)
  return elapsed > maxAge
}

/**
 * Get remaining timeout time
 */
export function getRemainingTimeout(request: NextRequest, maxAge: number = TIMEOUT_CONFIG.DEFAULT): number {
  const startTime = request.headers.get("x-request-start")
  if (!startTime) return maxAge
  
  const elapsed = Date.now() - parseInt(startTime)
  return Math.max(0, maxAge - elapsed)
}
