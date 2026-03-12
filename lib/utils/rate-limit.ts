import { createClient } from "@/lib/supabase/server"

interface RateLimitConfig {
  key: string
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit for a given key
 * Uses in-memory store for development, should use Redis/KV in production
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now()
  const storeKey = `ratelimit:${config.key}`
  
  // In production, use Redis or Supabase KV
  if (process.env.NODE_ENV === "production" && process.env.KV_REST_API_URL) {
    return await checkRateLimitProduction(config, now)
  }

  // Development: use in-memory store
  const entry = rateLimitStore.get(storeKey)
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    }
  }

  entry.count++
  rateLimitStore.set(storeKey, entry)
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Production rate limiting using Supabase
 */
async function checkRateLimitProduction(
  config: RateLimitConfig,
  now: number
): Promise<RateLimitResult> {
  const supabase = await createClient()
  
  // Use Supabase RPC for atomic increment
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: config.key,
    p_max_requests: config.maxRequests,
    p_window_ms: config.windowMs
  })

  if (error) {
    console.error("Rate limit check failed:", error)
    return {
      success: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs
    }
  }

  const result = data as { count: number; reset_at: number }
  
  if (result.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: result.reset_at,
      retryAfter: Math.ceil((result.reset_at - now) / 1000)
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - result.count,
    resetAt: result.reset_at
  }
}

/**
 * Rate limit presets for common use cases
 */
export const RATE_LIMITS = {
  // Authentication
  LOGIN: {
    key: "auth:login",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  SIGNUP: {
    key: "auth:signup",
    maxRequests: 3,
    windowMS: 60 * 60 * 1000 // 1 hour
  },
  PASSWORD_RESET: {
    key: "auth:password-reset",
    maxRequests: 3,
    windowMS: 60 * 60 * 1000 // 1 hour
  },
  
  // Messaging
  SEND_MESSAGE: {
    key: "messages:send",
    maxRequests: 60,
    windowMS: 60 * 1000 // 1 minute
  },
  
  // Posts
  CREATE_POST: {
    key: "posts:create",
    maxRequests: 10,
    windowMS: 60 * 60 * 1000 // 1 hour
  },
  CREATE_COMMENT: {
    key: "comments:create",
    maxRequests: 30,
    windowMS: 60 * 60 * 1000 // 1 hour
  },
  
  // API endpoints
  API_EMBEDDING: {
    key: "api:embedding",
    maxRequests: 5,
    windowMS: 60 * 60 * 1000 // 1 hour
  },
  
  // General
  GENERAL: {
    key: "general",
    maxRequests: 100,
    windowMS: 60 * 1000 // 1 minute
  }
}

/**
 * Higher-order function to wrap server actions with rate limiting
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: RateLimitConfig
): (...args: TArgs) => Promise<TResult | { success: false; error: string; retryAfter?: number }> {
  return async (...args: TArgs) => {
    const result = await checkRateLimit(config)
    
    if (!result.success) {
      return {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: result.retryAfter
      }
    }
    
    return fn(...args)
  }
}
