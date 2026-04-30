import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRegistry } from '@/lib/ai/providers/registry'
import { AllProvidersFailedError } from '@/lib/ai/errors'
import type { AIProvider, Message, AIProviderResponse } from '@/lib/ai/providers/base'

const createMockProvider = (name: string, priority: number): AIProvider => {
  const provider = {
    config: {
      name,
      model: 'test-model',
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000
    },
    chat: vi.fn()
  }
  return provider as unknown as AIProvider
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const provider = createMockProvider('test', 1)
      registry.registerProvider({
        name: 'test',
        provider,
        priority: 1,
        capabilities: ['chat']
      })

      expect(registry.getAvailableProviders()).toContain('test')
    })

    it('should set lowest priority provider as default', () => {
      const provider1 = createMockProvider('provider1', 2)
      const provider2 = createMockProvider('provider2', 1)
      const provider3 = createMockProvider('provider3', 3)

      registry.registerProvider({ name: 'provider1', provider: provider1, priority: 2, capabilities: ['chat'] })
      registry.registerProvider({ name: 'provider2', provider: provider2, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'provider3', provider: provider3, priority: 3, capabilities: ['chat'] })

      const defaultProvider = registry.getProvider()
      expect(defaultProvider.config.name).toBe('provider2')
    })
  })

  describe('getProvider', () => {
    it('should return specific provider by name', () => {
      const provider = createMockProvider('specific', 1)
      registry.registerProvider({
        name: 'specific',
        provider,
        priority: 1,
        capabilities: ['chat']
      })

      expect(registry.getProvider('specific').config.name).toBe('specific')
    })

    it('should throw when provider not found', () => {
      expect(() => registry.getProvider('nonexistent')).toThrow('Provider nonexistent not found')
    })

    it('should return default provider when name not specified', () => {
      const provider = createMockProvider('default', 1)
      registry.registerProvider({
        name: 'default',
        provider,
        priority: 1,
        capabilities: ['chat']
      })

      expect(registry.getProvider().config.name).toBe('default')
    })
  })

  describe('getAvailableProviders', () => {
    it('should list all registered providers', () => {
      registry.registerProvider({ name: 'p1', provider: createMockProvider('p1', 1), priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'p2', provider: createMockProvider('p2', 2), priority: 2, capabilities: ['chat'] })

      const providers = registry.getAvailableProviders()
      expect(providers).toHaveLength(2)
      expect(providers).toContain('p1')
      expect(providers).toContain('p2')
    })
  })

  describe('chatWithFallback', () => {
    const messages: Message[] = [{ role: 'user' as const, content: 'Hello' }]

    it('should try preferred provider first', async () => {
      const preferredProvider = createMockProvider('preferred', 2)
      const fallbackProvider = createMockProvider('fallback', 1)

      const preferredResponse: AIProviderResponse = { content: 'preferred response', model: 'test' }
      vi.mocked(preferredProvider.chat).mockResolvedValue(preferredResponse)

      registry.registerProvider({ name: 'preferred', provider: preferredProvider, priority: 2, capabilities: ['chat'] })
      registry.registerProvider({ name: 'fallback', provider: fallbackProvider, priority: 1, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages, { preferredProvider: 'preferred' })
      expect(result.content).toBe('preferred response')
      expect(preferredProvider.chat).toHaveBeenCalledWith(messages)
    })

    it('should fallback to next provider when primary fails', async () => {
      const primaryProvider = createMockProvider('primary', 1)
      const fallbackProvider = createMockProvider('fallback', 2)

      const fallbackResponse: AIProviderResponse = { content: 'fallback response', model: 'test' }
      vi.mocked(primaryProvider.chat).mockRejectedValue(new Error('Primary failed'))
      vi.mocked(fallbackProvider.chat).mockResolvedValue(fallbackResponse)

      registry.registerProvider({ name: 'primary', provider: primaryProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'fallback', provider: fallbackProvider, priority: 2, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages)
      expect(result.content).toBe('fallback response')
    })

    it('should throw AllProvidersFailedError when all providers fail', async () => {
      const provider1 = createMockProvider('provider1', 1)
      const provider2 = createMockProvider('provider2', 2)

      vi.mocked(provider1.chat).mockRejectedValue(new Error('Error 1'))
      vi.mocked(provider2.chat).mockRejectedValue(new Error('Error 2'))

      registry.registerProvider({ name: 'provider1', provider: provider1, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'provider2', provider: provider2, priority: 2, capabilities: ['chat'] })

      await expect(registry.chatWithFallback(messages)).rejects.toThrow(AllProvidersFailedError)
    })
  })
})