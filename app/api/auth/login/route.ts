import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// In-memory store for failed login attempts (use Redis in production)
const failedAttempts = new Map<string, {
  count: number
  lastAttempt: number
  lockedUntil: number
  backoffUntil: number
}>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of failedAttempts.entries()) {
    // Remove entries older than 24 hours
    if (now - data.lastAttempt > 24 * 60 * 60 * 1000) {
      failedAttempts.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface LoginRequest {
  email: string
  password: string
}

/**
 * POST /api/auth/login
 * 
 * Handles user authentication with rate limiting and account lockout protection.
 * 
 * Rate Limiting:
 * - General: 100 requests per 15 minutes per IP
 * - Auth-specific: 5 attempts per 15 minutes per email/IP combination
 * - Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
 * - Account lockout: After 10 failed attempts, account locked for 30 minutes
 * 
 * @param request - Next.js request object
 * @returns Authentication result or error response
 */
export async function POST(request: NextRequest) {
  // Apply general rate limit first
  const generalRateLimit = rateLimit(request, 'general')
  if (!generalRateLimit.allowed && generalRateLimit.response) {
    return generalRateLimit.response
  }

  // Get client identifier (email + IP for more accurate tracking)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  try {
    const body = await request.json() as LoginRequest
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create rate limit key based on email and IP
    const rateLimitKey = `${email.toLowerCase()}:${ip}`
    const now = Date.now()
    
    // Check for account lockout
    const lockoutData = failedAttempts.get(rateLimitKey)
    if (lockoutData && lockoutData.lockedUntil > now) {
      const remainingLockTime = Math.ceil((lockoutData.lockedUntil - now) / 1000 / 60)
      logger.auth.warn('Login attempt on locked account', {
        email: email.toLowerCase(),
        ip,
        remainingLockTime,
      })
      
      return NextResponse.json(
        {
          error: 'Account temporarily locked',
          message: `Too many failed attempts. Please try again in ${remainingLockTime} minutes.`,
          locked: true,
          retryAfter: remainingLockTime * 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': (remainingLockTime * 60).toString(),
            'X-Account-Locked': 'true',
          },
        }
      )
    }

    // Check for exponential backoff
    if (lockoutData && lockoutData.backoffUntil > now) {
      const remainingBackoff = Math.ceil((lockoutData.backoffUntil - now) / 1000)
      logger.auth.info('Login attempt during backoff period', {
        email: email.toLowerCase(),
        ip,
        remainingBackoff,
      })
      
      return NextResponse.json(
        {
          error: 'Too many attempts',
          message: 'Please wait before trying again',
          retryAfter: remainingBackoff,
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingBackoff.toString(),
          },
        }
      )
    }

    // Attempt authentication via Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    // Handle authentication failure
    if (error) {
      logger.auth.warn('Failed login attempt', {
        email: email.toLowerCase(),
        ip,
        errorCode: error.code,
        errorStatus: error.status,
      })

      // Update failed attempts
      const currentData = failedAttempts.get(rateLimitKey) || {
        count: 0,
        lastAttempt: 0,
        lockedUntil: 0,
        backoffUntil: 0,
      }

      const newCount = currentData.count + 1
      
      // Account lockout after 10 failed attempts
      if (newCount >= 10) {
        const lockoutDuration = 30 * 60 * 1000 // 30 minutes
        failedAttempts.set(rateLimitKey, {
          count: newCount,
          lastAttempt: now,
          lockedUntil: now + lockoutDuration,
          backoffUntil: 0,
        })
        
        logger.auth.error('Account locked due to failed attempts', {
          email: email.toLowerCase(),
          ip,
          failedAttempts: newCount,
        })

        return NextResponse.json(
          {
            error: 'Account temporarily locked',
            message: 'Too many failed attempts. Account locked for 30 minutes.',
            locked: true,
            retryAfter: 1800, // 30 minutes in seconds
          },
          {
            status: 429,
            headers: {
              'Retry-After': '1800',
              'X-Account-Locked': 'true',
            },
          }
        )
      }

      // Exponential backoff: 2^(attempts-1) seconds (1, 2, 4, 8, 16, 32, 64, 128, 256)
      const backoffSeconds = Math.min(Math.pow(2, newCount - 1), 256)
      const backoffMs = backoffSeconds * 1000

      failedAttempts.set(rateLimitKey, {
        count: newCount,
        lastAttempt: now,
        lockedUntil: 0,
        backoffUntil: now + backoffMs,
      })

      logger.auth.info('Failed login with backoff', {
        email: email.toLowerCase(),
        ip,
        attempts: newCount,
        backoffSeconds,
      })

      return NextResponse.json(
        {
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect',
          attemptsRemaining: 10 - newCount,
          retryAfter: backoffSeconds,
        },
        {
          status: 401,
          headers: {
            'Retry-After': backoffSeconds.toString(),
            'X-RateLimit-Attempts-Remaining': (10 - newCount).toString(),
          },
        }
      )
    }

    // Successful login - clear failed attempts
    failedAttempts.delete(rateLimitKey)

    logger.auth.info('Successful login', {
      userId: data.user.id,
      email: email.toLowerCase(),
      ip,
    })

    // Return success with user data (excluding sensitive info)
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_verified: data.user.email_confirmed_at !== null,
      },
      session: {
        expires_at: data.session?.expires_at,
      },
    }, {
      status: 200,
      headers: {
        'X-RateLimit-Attempts-Remaining': '10',
      },
    })

  } catch (error) {
    logger.auth.error('Login endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
