import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

function createMockRequest(ip: string = '192.168.1.1', userAgent: string = 'Mozilla/5.0') {
  return {
    headers: {
      get: (name: string) => {
        switch (name) {
          case 'x-forwarded-for': return ip
          case 'user-agent': return userAgent
          default: return null
        }
      }
    }
  } as any
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rateLimit function', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest('10.0.0.1')
      const result = rateLimit(request, 'general')
      
      expect(result.allowed).toBe(true)
      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '100')
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining')
    })

    it('should return response when rate limited', () => {
      const request = createMockRequest('10.0.0.2')
      
      // Make many requests to exceed limit
      for (let i = 0; i < 105; i++) {
        rateLimit(request, 'general')
      }
      
      const result = rateLimit(request, 'general')
      
      expect(result.allowed).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(429)
    })

    it('should include retry-after header when blocked', () => {
      const request = createMockRequest('10.0.0.3')
      
      // Exceed limit
      for (let i = 0; i < 105; i++) {
        rateLimit(request, 'general')
      }
      
      const result = rateLimit(request, 'general')
      
      if (result.response) {
        const headers = result.response.headers
        expect(headers.get('Retry-After')).toBeDefined()
      }
    })

    it('should use different limits for different types', () => {
      const request = createMockRequest('10.0.0.4')
      
      // Auth has stricter limits (5 per 15 min)
      for (let i = 0; i < 5; i++) {
        rateLimit(request, 'auth')
      }
      
      const result = rateLimit(request, 'auth')
      
      expect(result.allowed).toBe(false)
      expect(result.headers['X-RateLimit-Limit']).toBe('5')
    })

    it('should track different IPs separately', () => {
      const request1 = createMockRequest('10.0.0.5')
      const request2 = createMockRequest('10.0.0.6')
      
      // Use up limit for IP1
      for (let i = 0; i < 105; i++) {
        rateLimit(request1, 'general')
      }
      
      // IP2 should still be allowed
      const result = rateLimit(request2, 'general')
      expect(result.allowed).toBe(true)
    })

    it('should use fingerprint based on IP and user agent', () => {
      const request1 = createMockRequest('10.0.0.7', 'Bot1')
      const request2 = createMockRequest('10.0.0.7', 'Bot2')
      
      // Same IP but different UA should be tracked separately
      for (let i = 0; i < 50; i++) {
        rateLimit(request1, 'general')
      }
      
      const result = rateLimit(request2, 'general')
      expect(result.allowed).toBe(true)
      expect(result.headers['X-RateLimit-Remaining']).toBe('49')
    })
  })

  describe('getRateLimitHeaders', () => {
    it('should return rate limit headers object', () => {
      const headers = getRateLimitHeaders(50, 1234567890, 100)
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '50',
        'X-RateLimit-Reset': '1234567890'
      })
    })

    it('should handle zero remaining', () => {
      const headers = getRateLimitHeaders(0, 1234567890, 100)
      
      expect(headers['X-RateLimit-Remaining']).toBe('0')
    })
  })

  describe('Rate limit configurations', () => {
    it('should have correct general limits', () => {
      const request = createMockRequest('10.0.0.8')
      const result = rateLimit(request, 'general')
      
      expect(result.headers['X-RateLimit-Limit']).toBe('100')
    })

    it('should have correct auth limits', () => {
      const request = createMockRequest('10.0.0.9')
      const result = rateLimit(request, 'auth')
      
      expect(result.headers['X-RateLimit-Limit']).toBe('5')
    })

    it('should have correct API limits', () => {
      const request = createMockRequest('10.0.0.10')
      const result = rateLimit(request, 'api')
      
      expect(result.headers['X-RateLimit-Limit']).toBe('30')
    })
  })
})
