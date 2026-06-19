/**
 * Environment Configuration
 * Centralizes all env var access with dev/prod detection.
 *
 * URL resolution priority (production):
 *   1. Individual per-service env var (EMBEDDING_SERVICE_URL, etc.)
 *   2. BACKEND_DOMAIN — derives all 4 service URLs via subdomain pattern
 *   3. Docker / localhost (development only)
 *
 * In dev/preview mode the app ALWAYS uses Docker or localhost — even if
 * remote URLs are set. This prevents accidental routing to production.
 *
 * Usage:
 *   # Production — set ONE env var:
 *   BACKEND_DOMAIN=ahsanali.cc
 *   # → embedding.ahsanali.cc, notify.ahsanali.cc, feed.ahsanali.cc, match.ahsanali.cc
 *
 *   # Or override individual services if needed:
 *   EMBEDDING_SERVICE_URL=https://custom-embedding.example.com
 */

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction

/**
 * Subdomain prefixes for each microservice.
 * Combined with BACKEND_DOMAIN to form full URLs in production.
 */
const SUBDOMAINS = {
  embedding: 'embedding',
  notification: 'notify',
  feed: 'feed',
  match: 'match',
} as const

/** Subdomain → port mapping for local/Docker development */
const PORTS = {
  embedding: process.env.EMBEDDING_SERVICE_PORT || '8000',
  notification: process.env.NOTIFICATION_SERVICE_PORT || '8002',
  feed: process.env.FEED_SERVICE_PORT || '8003',
  match: process.env.MATCH_SERVICE_PORT || '8004',
} as const

function resolveServiceUrl(
  envVar: string | undefined,
  subdomain: string,
  dockerPort: string,
  localPort: string,
): string {
  // Priority: 1. Individual env var override → 2. BACKEND_DOMAIN → 3. Docker → 4. Local
  if (isProduction) {
    if (envVar) return envVar
    const domain = process.env.BACKEND_DOMAIN
    if (domain) return `https://${subdomain}.${domain}`
  }
  if (process.env.IN_DOCKER_CONTAINER === 'true') return `http://host.docker.internal:${dockerPort}`
  return `http://localhost:${localPort}`
}

/** Resolve a health URL with the same priority chain */
function resolveHealthUrl(envVar: string | undefined, subdomain: string, localUrl: string): string {
  if (isProduction) {
    if (envVar) return envVar + '/health'
    const domain = process.env.BACKEND_DOMAIN
    if (domain) return `https://${subdomain}.${domain}/health`
  }
  return localUrl + '/health'
}

export const config = {
  environment: isProduction ? 'production' : 'development',
  isProduction,
  isDevelopment,

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set')
      return ''
    })(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (() => {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
      return ''
    })(),
  },

  /** Embedding / vector generation service */
  embedding: {
    url: resolveServiceUrl(
      process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL,
      SUBDOMAINS.embedding,
      PORTS.embedding,
      PORTS.embedding,
    ),
    healthUrl: resolveHealthUrl(
      process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL,
      SUBDOMAINS.embedding,
      `http://localhost:${PORTS.embedding}`,
    ),
  },

  /** Backward-compat alias: worker → embedding */
  worker: {
    url: isProduction
      ? (process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL || `http://localhost:${PORTS.embedding}`)
      : (process.env.IN_DOCKER_CONTAINER === 'true' ? 'http://host.docker.internal:8000' : 'http://localhost:8000'),
    healthUrl: isProduction
      ? ((process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL || `http://localhost:${PORTS.embedding}`) + '/health')
      : ((process.env.IN_DOCKER_CONTAINER === 'true' ? 'http://host.docker.internal:8000' : 'http://localhost:8000') + '/health'),
  },

  /** Notification service */
  notification: {
    url: resolveServiceUrl(
      process.env.NOTIFICATION_SERVICE_URL,
      SUBDOMAINS.notification,
      PORTS.notification,
      PORTS.notification,
    ),
    healthUrl: resolveHealthUrl(
      process.env.NOTIFICATION_SERVICE_URL,
      SUBDOMAINS.notification,
      `http://localhost:${PORTS.notification}`,
    ),
  },

  /** Feed scoring service (Thompson Sampling) */
  feed: {
    url: resolveServiceUrl(
      process.env.FEED_SERVICE_URL,
      SUBDOMAINS.feed,
      PORTS.feed,
      PORTS.feed,
    ),
    healthUrl: resolveHealthUrl(
      process.env.FEED_SERVICE_URL,
      SUBDOMAINS.feed,
      `http://localhost:${PORTS.feed}`,
    ),
  },

  /** Match generation service */
  match: {
    url: resolveServiceUrl(
      process.env.MATCH_SERVICE_URL,
      SUBDOMAINS.match,
      PORTS.match,
      PORTS.match,
    ),
    healthUrl: resolveHealthUrl(
      process.env.MATCH_SERVICE_URL,
      SUBDOMAINS.match,
      `http://localhost:${PORTS.match}`,
    ),
  },

  features: {
    enableRealtime: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    enableWorker: Boolean(isProduction
      ? (process.env.EMBEDDING_SERVICE_URL || process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.BACKEND_DOMAIN)
      : true),
  },
} as const

export type Config = typeof config
