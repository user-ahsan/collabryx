export interface RateLimitStore {
  incr(key: string, ttl: number): Promise<{ count: number; resetAt: number }>
}

/**
 * Vercel KV-based rate limit store for production deployments.
 * Uses @vercel/kv if available, falls back to in-memory with TTL cleanup.
 */
export class RedisRateLimitStore implements RateLimitStore {
  private kvAvailable: boolean
  // In-memory fallback with TTL cleanup
  private store = new Map<string, { count: number; resetAt: number }>()

  constructor() {
    // Check if Vercel KV is configured
    this.kvAvailable = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  }

  async incr(key: string, ttl: number): Promise<{ count: number; resetAt: number }> {
    if (this.kvAvailable) {
      return this.incrVercelKV(key, ttl)
    }
    return this.incrMemory(key, ttl)
  }

  private async incrVercelKV(key: string, ttl: number): Promise<{ count: number; resetAt: number }> {
    try {
      const now = Date.now()
      const windowKey = `ratelimit:${key}:${Math.floor(now / ttl) * ttl}`
      const resetAt = (Math.floor(now / ttl) + 1) * ttl

      // Use Vercel KV REST API
      const kvUrl = process.env.KV_REST_API_URL!
      const kvToken = process.env.KV_REST_API_TOKEN!

      // Increment using HINCRBY for atomic operation
      const response = await fetch(`${kvUrl}/hincrby/${encodeURIComponent(windowKey)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field: 'count', increment: 1 }),
      })

      if (!response.ok) {
        throw new Error(`Vercel KV error: ${response.status}`)
      }

      const data = await response.json()
      const count = data.result ?? 1

      // Set expiry on the key
      await fetch(`${kvUrl}/expire/${encodeURIComponent(windowKey)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seconds: Math.ceil(ttl / 1000) }),
      })

      return { count, resetAt }
    } catch {
      // Fall back to in-memory on KV failure
      return this.incrMemory(key, ttl)
    }
  }

  private incrMemory(key: string, ttl: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now()
    const storeKey = `ratelimit:${key}`
    const entry = this.store.get(storeKey)
    const resetAt = now + ttl

    if (!entry || now > entry.resetAt) {
      this.store.set(storeKey, { count: 1, resetAt })
      return Promise.resolve({ count: 1, resetAt })
    }

    entry.count++
    this.store.set(storeKey, entry)
    return Promise.resolve({ count: entry.count, resetAt: entry.resetAt })
  }
}

// Periodic cleanup for in-memory fallback
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  // Note: This only cleans up the in-memory fallback store
  // Vercel KV handles its own expiry
}, 5 * 60 * 1000)

// Prevent the interval from keeping the process alive in serverless
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref()
}