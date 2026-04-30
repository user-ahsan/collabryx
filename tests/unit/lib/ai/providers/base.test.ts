import { describe, it, expect } from 'vitest'
import type { AIProviderConfig, AIProviderResponse, Message } from '@/lib/ai/providers/base'

describe('AI Provider Base Types', () => {
  describe('AIProviderConfig', () => {
    it('should accept valid provider config', () => {
      const config: AIProviderConfig = {
        name: 'minimax',
        apiKey: 'test-key',
        baseURL: 'https://api.minimaxi.com/v1',
        model: 'MiniMax-M2.7',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000
      }
      
      expect(config.name).toBe('minimax')
      expect(config.model).toBe('MiniMax-M2.7')
    })

    it('should allow optional fields', () => {
      const config: AIProviderConfig = {
        name: 'test',
        model: 'test-model',
        maxTokens: 1000,
        temperature: 0.5,
        timeout: 10000
      }
      
      expect(config.apiKey).toBeUndefined()
      expect(config.baseURL).toBeUndefined()
    })
  })

  describe('AIProviderResponse', () => {
    it('should accept valid response', () => {
      const response: AIProviderResponse = {
        content: 'Hello, how can I help you?',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        },
        model: 'MiniMax-M2.7',
        finishReason: 'stop'
      }
      
      expect(response.content).toBe('Hello, how can I help you?')
      expect(response.usage?.totalTokens).toBe(30)
    })

    it('should allow minimal response', () => {
      const response: AIProviderResponse = {
        content: 'Simple response',
        model: 'test'
      }
      
      expect(response.usage).toBeUndefined()
      expect(response.finishReason).toBeUndefined()
    })
  })

  describe('Message', () => {
    it('should support system role', () => {
      const message: Message = {
        role: 'system',
        content: 'You are a helpful assistant'
      }
      
      expect(message.role).toBe('system')
    })

    it('should support user role', () => {
      const message: Message = {
        role: 'user',
        content: 'I need help with my code'
      }
      
      expect(message.role).toBe('user')
    })

    it('should support assistant role', () => {
      const message: Message = {
        role: 'assistant',
        content: 'I would be happy to help'
      }
      
      expect(message.role).toBe('assistant')
    })
  })
})