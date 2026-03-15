// ===========================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// ===========================================
// Provides retry logic for failed API calls with exponential backoff
// and jitter to prevent thundering herd problems

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: Error) => boolean
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  shouldRetry: () => true,
  onRetry: () => {},
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)

  // Add jitter (±25% randomness) to prevent thundering herd
  const jitter = (Math.random() - 0.5) * 0.5 * exponentialDelay

  // Calculate final delay with jitter
  const delayWithJitter = exponentialDelay + jitter

  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay)
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetchPosts(options),
 *   { maxRetries: 3, onRetry: (attempt, error) => console.log(`Retry ${attempt}`) }
 * )
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, shouldRetry, onRetry } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if shouldRetry returns false
      if (!shouldRetry(lastError)) {
        throw lastError
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = calculateDelay(attempt, baseDelay, maxDelay)

        onRetry(attempt + 1, lastError)

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Retry a Supabase query with exponential backoff
 *
 * @example
 * ```typescript
 * const { data, error } = await retrySupabase(
 *   () => supabase.from('posts').select('*').eq('is_archived', false)
 * )
 * ```
 */
export async function retrySupabase<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await retry(
      async () => {
        const { data, error } = await fn()

        if (error) {
          throw new Error(error.message || "Supabase error")
        }

        return data
      },
      {
        ...options,
        shouldRetry: (error) => {
          // Retry on network errors, timeouts, and 5xx errors
          const message = error.message.toLowerCase()
          return (
            message.includes("network") ||
            message.includes("timeout") ||
            message.includes("50") ||
            message.includes("server") ||
            message.includes("connection")
          )
        },
      }
    )

    return { data: result, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return true
  }

  // Timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return true
  }

  // Server errors (5xx)
  if (message.includes("50") || message.includes("internal server")) {
    return true
  }

  // Connection errors
  if (message.includes("connection") || message.includes("econnrefused")) {
    return true
  }

  // Rate limiting (retry after delay)
  if (message.includes("429") || message.includes("rate limit")) {
    return true
  }

  return false
}

/**
 * Retry with a circuit breaker pattern
 * Stops retrying if too many consecutive failures occur
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime: number | null = null
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if it's time to try again
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open"
      } else {
        throw new Error("Circuit breaker is open")
      }
    }

    try {
      const result = await fn()

      // Success - reset counter
      this.failureCount = 0
      this.state = "closed"

      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.failureThreshold) {
        this.state = "open"
      }

      throw error
    }
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state
  }

  reset(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.state = "closed"
  }
}

// ===========================================
// GLOBAL CIRCUIT BREAKER INSTANCES
// ===========================================

// Shared circuit breaker for Supabase calls
export const supabaseCircuitBreaker = new CircuitBreaker(5, 60000)

// Circuit breaker for external API calls
export const apiCircuitBreaker = new CircuitBreaker(3, 30000)

/**
 * Execute a Supabase query with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  type: "supabase" | "api" = "supabase"
): Promise<T> {
  const breaker = type === "supabase" ? supabaseCircuitBreaker : apiCircuitBreaker
  return breaker.execute(fn)
}
