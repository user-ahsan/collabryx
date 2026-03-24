/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { checkBot, shouldBlockBot, getBotHeaders } from '@/lib/bot-detection'

function createMockRequest(userAgent: string = '', path: string = '/', acceptLanguage: string = 'en-US', acceptEncoding: string = 'gzip, br') {
  return {
    headers: {
      get: (name: string) => {
        switch (name) {
          case 'user-agent': return userAgent
          case 'accept-language': return acceptLanguage
          case 'accept-encoding': return acceptEncoding
          default: return null
        }
      }
    },
    nextUrl: { pathname: path }
  } as any
}

describe('Bot Detection', () => {
  describe('checkBot', () => {
    it('should return low score for normal browser requests', () => {
      const result = checkBot(createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '/dashboard',
        'en-US',
        'gzip, br'
      ))
      
      expect(result.isBot).toBe(false)
      expect(result.isSafeBot).toBe(false)
      expect(result.score).toBeLessThan(50)
    })

    it('should identify safe search engine bots', () => {
      const safeBots = [
        'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; Bingbot/2.0)',
        'Mozilla/5.0 (compatible; YandexBot/3.0)',
        'facebookexternalhit/1.1',
        'Twitterbot/1.0'
      ]

      safeBots.forEach(ua => {
        const result = checkBot(createMockRequest(ua))
        expect(result.isSafeBot).toBe(true)
        expect(result.score).toBe(0)
      })
    })

    it('should detect suspicious bot patterns', () => {
      const botUserAgents = [
        'python-requests/2.28.0',
        'curl/7.68.0',
        'wget/1.21',
        'HeadlessChrome/91.0',
        'Puppeteer/10.0'
      ]

      botUserAgents.forEach(ua => {
        const result = checkBot(createMockRequest(ua))
        expect(result.isBot).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(40)
      })
    })

    it('should increase score for suspicious paths', () => {
      const suspiciousPaths = ['/wp-admin', '/.env', '/.git', '/admin', '/backup']
      
      suspiciousPaths.forEach(path => {
        const result = checkBot(createMockRequest('Mozilla/5.0', path))
        expect(result.isSuspicious).toBe(true)
        expect(result.score).toBeGreaterThanOrEqual(50)
      })
    })

    it('should increase score for missing headers', () => {
      const result = checkBot(createMockRequest(
        'Mozilla/5.0',
        '/',
        '', // No accept-language
        ''  // No accept-encoding
      ))
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('Missing')
    })

    it('should handle missing user agent', () => {
      const result = checkBot(createMockRequest(''))
      
      expect(result.score).toBeGreaterThanOrEqual(30)
    })

    it('should return score capped at 100', () => {
      const result = checkBot(createMockRequest(
        'python',
        '/wp-admin',
        '',
        ''
      ))
      
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('shouldBlockBot', () => {
    it('should not block safe bots', () => {
      expect(shouldBlockBot({ isBot: true, isSafeBot: true, isSuspicious: false, score: 0, reason: 'Safe' })).toBe(false)
    })

    it('should block suspicious bots', () => {
      expect(shouldBlockBot({ isBot: true, isSafeBot: false, isSuspicious: true, score: 60, reason: 'Suspicious' })).toBe(true)
    })

    it('should block high score bots', () => {
      expect(shouldBlockBot({ isBot: true, isSafeBot: false, isSuspicious: false, score: 75, reason: 'High score' })).toBe(true)
    })

    it('should not block low score bots', () => {
      expect(shouldBlockBot({ isBot: true, isSafeBot: false, isSuspicious: false, score: 50, reason: 'Low score' })).toBe(false)
    })
  })

  describe('getBotHeaders', () => {
    it('should return bot detection headers', () => {
      const result = { isBot: true, isSafeBot: false, isSuspicious: false, score: 75, reason: 'Test reason' }
      const headers = getBotHeaders(result)
      
      expect(headers).toHaveProperty('X-Bot-Score', '75')
      expect(headers).toHaveProperty('X-Bot-Detected', 'true')
      expect(headers['X-Bot-Reason']).toContain('Test')
    })
  })
})
