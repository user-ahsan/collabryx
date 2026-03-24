/**
 * Backend Configuration with Circuit Breaker Pattern
 * Automatically resolves backend URL based on deployment environment
 * Includes circuit breaker for fault tolerance
 */

export type BackendMode = 'auto' | 'docker' | 'render' | 'edge-only'

export interface BackendConfig {
  endpoint: string | null  // null = use Edge Function
  mode: BackendMode
  isHealthy: boolean
  healthCheck?: () => Promise<boolean>
}

/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by failing fast when backend is unhealthy
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private readonly threshold: number
  private readonly timeout: number
  private readonly halfOpenMaxRequests: number
  private halfOpenRequests = 0

  constructor(threshold = 3, timeout = 15000, halfOpenMaxRequests = 1) {
    this.threshold = threshold
    this.timeout = timeout  // 15s (reduced from 30s for faster recovery)
    this.halfOpenMaxRequests = halfOpenMaxRequests
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if timeout has passed to try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
        this.halfOpenRequests = 0
        console.log('🔁 Circuit breaker entering half-open state')
      } else {
        throw new Error('Circuit breaker is open - backend unavailable')
      }
    }

    // Allow limited requests in half-open state
    if (this.state === 'half-open') {
      this.halfOpenRequests++
      if (this.halfOpenRequests > this.halfOpenMaxRequests) {
        throw new Error('Circuit breaker half-open max requests exceeded')
      }
    }

    try {
      const result = await fn()
      
      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
        this.halfOpenRequests = 0
        console.log('✅ Circuit breaker closed - backend healthy')
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      // Open circuit if threshold reached
      if (this.failures >= this.threshold) {
        this.state = 'open'
        console.warn('⚠️ Circuit breaker OPEN - backend unhealthy')
      }
      
      throw error
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    // Auto-transition from open to half-open if timeout passed
    if (this.state === 'open' && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
        this.halfOpenRequests = 0
      }
    }
    return this.state
  }

  reset() {
    this.failures = 0
    this.lastFailureTime = null
    this.state = 'closed'
    this.halfOpenRequests = 0
  }
}

// Global circuit breaker instance
const backendCircuitBreaker = new CircuitBreaker(3, 30000, 1)

// Cache health checks for 10 seconds to detect failures quickly
const healthCache = new Map<string, { healthy: boolean; timestamp: number }>()
const CACHE_TTL = 10000 // 10 seconds (reduced from 30s for faster failure detection)

/**
 * Check backend health with timeout
 */
async function checkHealth(url: string, timeoutMs = 5000): Promise<boolean> {
  // Check cache first
  const cached = healthCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.healthy
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
      method: 'GET',
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) return false
    
    const data = await response.json()
    const healthy = data.status === 'healthy'
    
    // Cache the result
    healthCache.set(url, { healthy, timestamp: Date.now() })
    
    return healthy
  } catch (error) {
    // Cache the failure
    healthCache.set(url, { healthy: false, timestamp: Date.now() })
    return false
  }
}

/**
 * Clear health cache (useful for testing or manual refresh)
 */
export function clearHealthCache(): void {
  healthCache.clear()
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(): 'closed' | 'open' | 'half-open' {
  return backendCircuitBreaker.getState()
}

/**
 * Reset circuit breaker (useful for manual recovery)
 */
export function resetCircuitBreaker(): void {
  backendCircuitBreaker.reset()
  clearHealthCache()
}

/**
 * Get backend configuration with circuit breaker protection
 * 
 * Resolution order:
 * 1. If BACKEND_MODE='edge-only' → return null (use Edge Function)
 * 2. If running on Vercel → use Render backend
 * 3. If BACKEND_MODE='docker' → use Docker backend
 * 4. If BACKEND_MODE='render' → use Render backend
 * 5. Auto-detect: try Docker health check, fallback to Edge Function
 */
export async function getBackendConfig(): Promise<BackendConfig> {
  const mode = process.env.BACKEND_MODE as BackendMode || 'auto'
  
  // Case 1: Edge-only mode (no backend)
  if (mode === 'edge-only') {
    return {
      endpoint: null,
      mode: 'edge-only',
      isHealthy: true,
    }
  }
  
  // Case 2: Running on Vercel (production)
  if (process.env.VERCEL) {
    const renderUrl = process.env.BACKEND_URL_RENDER
    if (!renderUrl) {
      console.warn('⚠️ Vercel deployment detected but BACKEND_URL_RENDER not set')
      console.warn('⚠️ Falling back to Edge Function')
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
    
    // Check circuit breaker state first
    const cbState = backendCircuitBreaker.getState()
    if (cbState === 'open') {
      console.warn('⚠️ Circuit breaker OPEN for Render backend, using Edge Function')
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
    
    // Health check for Render backend with circuit breaker
    try {
      const isHealthy = await backendCircuitBreaker.execute(() => checkHealth(renderUrl))
      
      return {
        endpoint: renderUrl,
        mode: 'render',
        isHealthy,
        healthCheck: () => checkHealth(renderUrl),
      }
    } catch (error) {
      // Circuit breaker opened or request failed
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
  }
  
  // Case 3: Force Docker mode (local dev)
  if (mode === 'docker') {
    const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
    
    const cbState = backendCircuitBreaker.getState()
    if (cbState === 'open') {
      console.error('❌ Circuit breaker OPEN for Docker backend')
      console.error('❌ Run: npm run docker:up')
      console.error('❌ Falling back to Edge Function')
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
    
    try {
      const isHealthy = await backendCircuitBreaker.execute(() => checkHealth(dockerUrl))
      
      return {
        endpoint: dockerUrl,
        mode: 'docker',
        isHealthy,
        healthCheck: () => checkHealth(dockerUrl),
      }
    } catch (error) {
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
  }
  
  // Case 4: Force Render mode (testing prod config locally)
  if (mode === 'render') {
    const renderUrl = process.env.BACKEND_URL_RENDER
    if (!renderUrl) {
      throw new Error('BACKEND_MODE=render but BACKEND_URL_RENDER not set')
    }
    
    const cbState = backendCircuitBreaker.getState()
    if (cbState === 'open') {
      console.warn('⚠️ Circuit breaker OPEN for Render backend')
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
    
    try {
      const isHealthy = await backendCircuitBreaker.execute(() => checkHealth(renderUrl))
      
      return {
        endpoint: renderUrl,
        mode: 'render',
        isHealthy,
        healthCheck: () => checkHealth(renderUrl),
      }
    } catch (error) {
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
  }
  
  // Case 5: Auto-detect (default)
  // Try Docker first, fallback to Edge Function
  const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
  
  const cbState = backendCircuitBreaker.getState()
  if (cbState === 'open') {
    console.log('⚠️ Circuit breaker OPEN, using Edge Function fallback')
    console.log('💡 Tip: Run "npm run docker:up" to start local backend')
    
    return {
      endpoint: null,
      mode: 'edge-only',
      isHealthy: false,
    }
  }
  
  try {
    const isHealthy = await backendCircuitBreaker.execute(() => checkHealth(dockerUrl, 2000))
    
    return {
      endpoint: dockerUrl,
      mode: 'docker',
      isHealthy,
      healthCheck: () => checkHealth(dockerUrl),
    }
  } catch (error) {
    console.log('⚠️ Docker backend not available, using Edge Function fallback')
    console.log('💡 Tip: Run "npm run docker:up" to start local backend')
    
    return {
      endpoint: null,
      mode: 'edge-only',
      isHealthy: false,
    }
  }
}

/**
 * Get backend URL for API calls
 * Returns null if Edge Function should be used
 */
export async function getBackendUrl(): Promise<string | null> {
  const config = await getBackendConfig()
  return config.endpoint
}

/**
 * Middleware: Check backend health before route execution with circuit breaker
 * Usage: wrap API route handlers with this
 */
export async function withBackendHealth<T>(
  handler: () => Promise<T>,
  fallbackHandler: () => Promise<T>
): Promise<T> {
  const cbState = backendCircuitBreaker.getState()
  
  if (cbState === 'open') {
    console.warn('⚠️ Circuit breaker OPEN, using fallback immediately')
    return fallbackHandler()
  }
  
  try {
    return await handler()
  } catch (error) {
    console.error('Backend error, falling back:', error)
    return fallbackHandler()
  }
}
