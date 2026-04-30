import type { RateLimitStore } from './redis-store'

export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map()

  async incr(key: string, ttl: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now()
    const existing = this.store.get(key)
    
    if (!existing || existing.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + ttl })
      return { count: 1, resetAt: now + ttl }
    }
    
    existing.count++
    return existing
  }
}