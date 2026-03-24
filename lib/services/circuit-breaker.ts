/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascade failures by failing fast when a service is unhealthy.
 * Provides automatic recovery through state transitions.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service failing, requests fail immediately
 * - HALF-OPEN: Testing recovery, limited requests allowed
 */

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  successThreshold?: number
  timeout?: number
  name?: string
}

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failureCount = 0
  private lastFailureTime?: Date
  private successCount = 0
  
  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly timeout: number
  private readonly name: string
  
  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.successThreshold = options.successThreshold ?? 2
    this.timeout = options.timeout ?? 30000 // 30 seconds
    this.name = options.name ?? 'default'
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime?.getTime() || 0)
      if (timeSinceLastFailure > this.timeout) {
        this.state = 'half-open'
        this.failureCount = 0
        this.successCount = 0
      } else {
        throw new CircuitBreakerOpenError(
          `Circuit breaker '${this.name}' is open. Retry after ${Math.ceil((this.timeout - timeSinceLastFailure) / 1000)}s`
        )
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch {
      this.onFailure()
      throw error
    }
  }
  
  /**
   * Execute with fallback function if circuit is open
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(fn)
    } catch {
      if (error instanceof CircuitBreakerOpenError) {
        return fallback()
      }
      throw error
    }
  }
  
  private onSuccess() {
    this.failureCount = 0
    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed'
        this.successCount = 0
      }
    }
  }
  
  private onFailure() {
    this.failureCount++
    this.lastFailureTime = new Date()
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
      this.successCount = 0
    }
  }
  
  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if timeout has passed for automatic transition to half-open
    if (this.state === 'open' && this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime()
      if (timeSinceLastFailure > this.timeout) {
        return 'half-open'
      }
    }
    return this.state
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime?.toISOString(),
    }
  }
  
  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = undefined
  }
}

/**
 * Custom error for circuit breaker open state
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CircuitBreakerOpenError'
  }
}

// Singleton instance for match services
export const matchCircuitBreaker = new CircuitBreaker({
  name: 'match-service',
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
})

// Export for other services
export { CircuitBreaker as default }
