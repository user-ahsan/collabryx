import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number
  maxRequests: number
  blockDuration: number
}

interface RateLimitEntry {
  count: number
  firstRequest: number
  blockedUntil: number
}

const RATE_LIMITS = {
  general: {
    interval: 60 * 1000,
    maxRequests: 100,
    blockDuration: 5 * 60 * 1000,
  },
  api: {
    interval: 60 * 1000,
    maxRequests: 30,
    blockDuration: 10 * 60 * 1000,
  },
  auth: {
    interval: 15 * 60 * 1000,
    maxRequests: 5,
    blockDuration: 30 * 60 * 1000,
  },
  upload: {
    interval: 60 * 60 * 1000,
    maxRequests: 20,
    blockDuration: 60 * 60 * 1000,
  },
  embeddings: {
    interval: 60 * 1000,
    maxRequests: 10,
    blockDuration: 5 * 60 * 1000,
  },
  aiChat: {
    interval: 60 * 60 * 1000,
    maxRequests: 20,
    blockDuration: 2 * 60 * 60 * 1000,
  },
  matches: {
    interval: 60 * 1000,
    maxRequests: 10,
    blockDuration: 5 * 60 * 1000,
  },
  fileUpload: {
    interval: 24 * 60 * 60 * 1000,
    maxRequests: 50,
    blockDuration: 24 * 60 * 60 * 1000,
  },
} as const

// In-memory store for single-instance deployments (development/local)
//
// ⚠️ PRODUCTION LIMITATIONS:
// - Resets on server restart (loses all rate limit state)
// - Does NOT work across multiple serverless instances (Vercel, Lambda, etc.)
// - Each serverless function instance has its own isolated Map
// - Users can bypass limits by hitting different function instances
//
// ✅ PRODUCTION FIX: Implement DB-backed rate limiting
//    Option A: Supabase RPC function `rate_limit_check(key TEXT, max_requests INT, window_sec INT)`
//    Option B: Use Upstash Redis (serverless-compatible, TTL-based counters)
//    Option C: Use Vercel KV (if on Vercel Pro)
//
// TODO: Implement distributed rate limiting with a DB/Redis backend before production deployment
//       Tracked at: lib/rate-limit.ts — migration to distributed storage required
const store = new Map<string, RateLimitEntry>()

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstRequest > 60 * 60 * 1000) {
      store.delete(key)
    }
  }
}

setInterval(cleanup, 5 * 60 * 1000)

/**
 * SECURITY NOTE: IP-based Rate Limiting Limitations
 *
 * This rate limiter uses x-forwarded-for and x-real-ip headers for client identification.
 * These headers CAN be spoofed by the client (e.g., setting X-Forwarded-For: 1.2.3.4).
 *
 * Limitations:
 * - x-forwarded-for is trivially spoofable unless stripped by a trusted reverse proxy
 * - x-real-ip is set by some proxies (nginx) but can be forged if client hits the app directly
 * - User-Agent rotation can bypass the ip:userAgent fingerprint
 *
 * Recommended mitigations for production:
 * - Combine IP with authenticated userId and session token for auth-related rate limits
 * - Trust x-forwarded-for only when behind a reverse proxy that strips incoming values
 * - For auth endpoints, use email-based rate limiting (see login/route.ts)
 * - Use database-backed rate limiting for multi-instance deployments
 */
function getFingerprint(request: NextRequest, ipOnly = false): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'
  if (ipOnly) return ip
  const userAgent = request.headers.get('user-agent') || ''
  return `${ip}:${userAgent}`
}

function checkRateLimit(
  fingerprint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let entry = store.get(fingerprint)

  if (!entry) {
    entry = {
      count: 1,
      firstRequest: now,
      blockedUntil: 0,
    }
    store.set(fingerprint, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.interval,
    }
  }

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    }
  }

  if (now - entry.firstRequest > config.interval) {
    entry.count = 1
    entry.firstRequest = now
    entry.blockedUntil = 0
    store.set(fingerprint, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.interval,
    }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    entry.blockedUntil = now + config.blockDuration
    store.set(fingerprint, entry)
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    }
  }

  store.set(fingerprint, entry)
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.firstRequest + config.interval,
  }
}

export function rateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'general'
): {
  allowed: boolean
  response?: NextResponse
  headers: Record<string, string>
  retryAfter?: number
} {
  const config = RATE_LIMITS[type]
  // Use IP-only fingerprint for auth to block bots rotating User-Agent
  const useIpOnly = type === 'auth'
  const fingerprint = getFingerprint(request, useIpOnly) + ':' + type
  const result = checkRateLimit(fingerprint, config)

  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  }

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
      headers,
      retryAfter,
    }
  }

  return {
    allowed: true,
    headers,
  }
}

export function getRateLimitHeaders(remaining: number, resetAt: number, limit: number) {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt.toString(),
  }
}

// Test-only: Clear the in-memory store (for testing purposes)
export function __clearRateLimitStore() {
  store.clear()
}
