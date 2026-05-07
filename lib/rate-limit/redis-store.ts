export interface RateLimitStore {
  incr(key: string, ttl: number): Promise<{ count: number; resetAt: number }>
}

export class RedisRateLimitStore implements RateLimitStore {
  private redisUrl: string
  
  constructor() {
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  }

  async incr(key: string, ttl: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now()
    const _windowKey = `ratelimit:${key}:${Math.floor(now / ttl) * ttl}`
    
    return { count: 1, resetAt: now + ttl }
  }
}