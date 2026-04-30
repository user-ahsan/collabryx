import { describe, it, expect } from 'vitest'
import {
  AIProviderError,
  MiniMaxAPIError,
  CircuitBreakerOpenError,
  AllProvidersFailedError
} from '@/lib/ai/errors'

describe('AI Errors', () => {
  describe('AIProviderError', () => {
    it('should create error with provider info', () => {
      const error = new AIProviderError('Provider failed', 'openai', 500)
      
      expect(error.message).toBe('Provider failed')
      expect(error.provider).toBe('openai')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('AIProviderError')
    })

    it('should work without status code', () => {
      const error = new AIProviderError('Provider failed', 'anthropic')
      
      expect(error.statusCode).toBeUndefined()
    })
  })

  describe('MiniMaxAPIError', () => {
    it('should create MiniMax-specific error', () => {
      const error = new MiniMaxAPIError('Invalid API key', 401, 1001)
      
      expect(error.message).toBe('Invalid API key')
      expect(error.provider).toBe('minimax')
      expect(error.statusCode).toBe(401)
      expect(error.errorCode).toBe(1001)
      expect(error.name).toBe('MiniMaxAPIError')
    })
  })

  describe('CircuitBreakerOpenError', () => {
    it('should indicate which provider has open circuit', () => {
      const error = new CircuitBreakerOpenError('openai')
      
      expect(error.provider).toBe('openai')
      expect(error.message).toContain('openai')
      expect(error.name).toBe('CircuitBreakerOpenError')
    })
  })

  describe('AllProvidersFailedError', () => {
    it('should indicate all providers are unavailable', () => {
      const error = new AllProvidersFailedError()
      
      expect(error.message).toBe('All AI providers are unavailable')
      expect(error.name).toBe('AllProvidersFailedError')
    })
  })
})