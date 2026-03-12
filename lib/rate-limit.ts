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
} as const

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

function getFingerprint(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
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
} {
  const config = RATE_LIMITS[type]
  const fingerprint = getFingerprint(request)
  const result = checkRateLimit(fingerprint, config)

  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  }

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      ),
      headers,
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
