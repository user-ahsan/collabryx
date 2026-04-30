import type { RateLimitStore } from './redis-store'
import { RedisRateLimitStore } from './redis-store'
import { InMemoryRateLimitStore } from './in-memory-store'

export function createRateLimitStore(): RateLimitStore {
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    return new RedisRateLimitStore()
  }
  return new InMemoryRateLimitStore()
}