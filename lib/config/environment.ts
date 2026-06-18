/**
 * Environment Configuration
 * Centralizes all env var access with dev/prod detection
 */

/**
 * Environment Configuration
 * Resolves microservice URLs based on deployment context:
 *   - Vercel → uses dedicated env vars (EMBEDDING_SERVICE_URL, etc.)
 *   - Docker  → uses host.docker.internal:{port}
 *   - Local   → uses localhost:{port}
 */

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction
const isVercel = process.env.VERCEL === '1'

// Local fallback ports for each microservice
const PORTS = {
  embedding: process.env.EMBEDDING_SERVICE_PORT || '8000',
  notification: process.env.NOTIFICATION_SERVICE_PORT || '8002',
  feed: process.env.FEED_SERVICE_PORT || '8003',
  match: process.env.MATCH_SERVICE_PORT || '8004',
} as const

function resolveServiceUrl(envVar: string | undefined, dockerPort: string, localPort: string): string {
  // Priority: 1. Explicit env var → 2. Vercel specific → 3. Docker → 4. Local
  if (envVar) return envVar
  if (isVercel) return `http://localhost:${localPort}` // fallback — real URL must be set on Vercel
  if (process.env.IN_DOCKER_CONTAINER === 'true') return `http://host.docker.internal:${dockerPort}`
  return `http://localhost:${localPort}`
}

export const config = {
  environment: isProduction ? 'production' : 'development',
  isProduction,
  isDevelopment,
  isVercel,

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => {
      if (!isVercel) console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set')
      return ''
    })(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (() => {
      if (!isVercel) console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
      return ''
    })(),
  },

  /** Embedding service (WorkerClient) — runs on HF Spaces */
  embedding: {
    url: resolveServiceUrl(
      process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL,
      PORTS.embedding,
      PORTS.embedding,
    ),
    healthUrl: (process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL || `http://localhost:${PORTS.embedding}`) + '/health',
  },

  /** Backward-compat alias: worker → embedding */
  worker: {
    url: process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL ||
        (process.env.IN_DOCKER_CONTAINER === 'true' ? 'http://host.docker.internal:8000' : 'http://localhost:8000'),
    healthUrl: (process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL ||
        (process.env.IN_DOCKER_CONTAINER === 'true' ? 'http://host.docker.internal:8000' : 'http://localhost:8000')) + '/health',
  },

  /** Notification service — runs on Render free tier */
  notification: {
    url: resolveServiceUrl(
      process.env.NOTIFICATION_SERVICE_URL,
      PORTS.notification,
      PORTS.notification,
    ),
    healthUrl: (process.env.NOTIFICATION_SERVICE_URL || `http://localhost:${PORTS.notification}`) + '/health',
  },

  /** Feed scoring service — runs on Render free tier */
  feed: {
    url: resolveServiceUrl(
      process.env.FEED_SERVICE_URL,
      PORTS.feed,
      PORTS.feed,
    ),
    healthUrl: (process.env.FEED_SERVICE_URL || `http://localhost:${PORTS.feed}`) + '/health',
  },

  /** Match generation service — runs on Render free tier */
  match: {
    url: resolveServiceUrl(
      process.env.MATCH_SERVICE_URL,
      PORTS.match,
      PORTS.match,
    ),
    healthUrl: (process.env.MATCH_SERVICE_URL || `http://localhost:${PORTS.match}`) + '/health',
  },

  features: {
    enableRealtime: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    enableWorker: Boolean(process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL || !isProduction),
  },
} as const

export type Config = typeof config
