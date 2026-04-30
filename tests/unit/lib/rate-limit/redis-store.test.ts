import { describe, it, expect, beforeEach } from 'vitest'
import { RedisRateLimitStore } from '@/lib/rate-limit/redis-store'

describe('RedisRateLimitStore', () => {
  let store: RedisRateLimitStore

  beforeEach(() => {
    store = new RedisRateLimitStore()
  })

  describe('incr', () => {
    it('should return count of 1 on first call', async () => {
      const result = await store.incr('test-key', 60000)
      
      expect(result.count).toBe(1)
      expect(result.resetAt).toBeDefined()
    })

    it('should return increased count', async () => {
      await store.incr('test-key', 60000)
      const result = await store.incr('test-key', 60000)
      
      expect(result.count).toBe(1)
    })

    it('should have resetAt in the future', async () => {
      const before = Date.now()
      const result = await store.incr('test-key', 60000)
      
      expect(result.resetAt).toBeGreaterThan(before)
    })
  })
})