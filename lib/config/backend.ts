/**
 * Backend Configuration
 * Automatically resolves backend URL based on deployment environment
 */

export type BackendMode = 'auto' | 'docker' | 'render' | 'edge-only'

export interface BackendConfig {
  endpoint: string | null  // null = use Edge Function
  mode: BackendMode
  isHealthy: boolean
  healthCheck?: () => Promise<boolean>
}

/**
 * Get backend configuration
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
    
    // Health check for Render backend
    const isHealthy = await checkHealth(renderUrl)
    
    return {
      endpoint: renderUrl,
      mode: 'render',
      isHealthy,
      healthCheck: () => checkHealth(renderUrl),
    }
  }
  
  // Case 3: Force Docker mode (local dev)
  if (mode === 'docker') {
    const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
    const isHealthy = await checkHealth(dockerUrl)
    
    if (!isHealthy) {
      console.error('❌ Docker backend not responding at', dockerUrl)
      console.error('❌ Run: npm run docker:up')
      console.error('❌ Falling back to Edge Function')
    }
    
    return {
      endpoint: isHealthy ? dockerUrl : null,
      mode: isHealthy ? 'docker' : 'edge-only',
      isHealthy,
      healthCheck: () => checkHealth(dockerUrl),
    }
  }
  
  // Case 4: Force Render mode (testing prod config locally)
  if (mode === 'render') {
    const renderUrl = process.env.BACKEND_URL_RENDER
    if (!renderUrl) {
      throw new Error('BACKEND_MODE=render but BACKEND_URL_RENDER not set')
    }
    
    const isHealthy = await checkHealth(renderUrl)
    
    return {
      endpoint: renderUrl,
      mode: 'render',
      isHealthy,
      healthCheck: () => checkHealth(renderUrl),
    }
  }
  
  // Case 5: Auto-detect (default)
  // Try Docker first, fallback to Edge Function
  const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
  
  try {
    const isHealthy = await checkHealth(dockerUrl, 2000) // 2s timeout
    
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
 * Check backend health with timeout
 */
async function checkHealth(url: string, timeoutMs = 5000): Promise<boolean> {
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
    return data.status === 'healthy'
  } catch (error) {
    return false
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
 * Middleware: Check backend health before route execution
 * Usage: wrap API route handlers with this
 */
export async function withBackendHealth<T>(
  handler: () => Promise<T>,
  fallbackHandler: () => Promise<T>
): Promise<T> {
  const config = await getBackendConfig()
  
  if (!config.isHealthy) {
    console.warn('⚠️ Backend unhealthy, using fallback')
    return fallbackHandler()
  }
  
  try {
    return await handler()
  } catch (error) {
    console.error('Backend error, falling back:', error)
    return fallbackHandler()
  }
}
