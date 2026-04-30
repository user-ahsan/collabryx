import { describe, it, expect } from 'vitest'
import { createRateLimitStore } from '@/lib/rate-limit/rate-limiter'
import { InMemoryRateLimitStore } from '@/lib/rate-limit/in-memory-store'

describe('rate-limiter factory', () => {
  it('should create in-memory store in development', () => {
    const store = createRateLimitStore()
    
    expect(store).toBeInstanceOf(InMemoryRateLimitStore)
  })

  it('should return a store with incr method', () => {
    const store = createRateLimitStore()
    
    expect(typeof store.incr).toBe('function')
  })
})