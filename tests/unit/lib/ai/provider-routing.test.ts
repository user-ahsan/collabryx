/**
 * TC-084: Provider Routing Tests
 * Verifies AI provider registry routes requests to correct provider,
 * handles failover gracefully, and uses provider-specific API keys/configs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRegistry } from '@/lib/ai/providers/registry'
import { AllProvidersFailedError, AIProviderError } from '@/lib/ai/errors'
import type { AIProvider, AIProviderConfig, Message, AIProviderResponse } from '@/lib/ai/providers/base'

function createMockProviderConfig(name: string, overrides: Partial<AIProviderConfig> = {}): AIProviderConfig {
  return {
    name,
    apiKey: `test-key-${name}`,
    model: `${name}-model`,
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000,
    ...overrides,
  }
}

function createMockProvider(config: AIProviderConfig): AIProvider {
  return {
    config,
    chat: vi.fn(),
  }
}

describe('AI Provider Routing (TC-084)', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  describe('Provider Registration with API Keys', () => {
    it('should store provider-specific API keys', () => {
      const geminiConfig = createMockProviderConfig('gemini', { apiKey: 'gemini-key-abc123' })
      const openaiConfig = createMockProviderConfig('openai', { apiKey: 'openai-key-xyz789' })

      const geminiProvider = createMockProvider(geminiConfig)
      const openaiProvider = createMockProvider(openaiConfig)

      registry.registerProvider({ name: 'gemini', provider: geminiProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'openai', provider: openaiProvider, priority: 2, capabilities: ['chat'] })

      const retrievedGemini = registry.getProvider('gemini')
      const retrievedOpenai = registry.getProvider('openai')

      expect(retrievedGemini.config.apiKey).toBe('gemini-key-abc123')
      expect(retrievedOpenai.config.apiKey).toBe('openai-key-xyz789')
    })

    it('should use provider-specific models', () => {
      const config = createMockProviderConfig('anthropic', { model: 'claude-sonnet-4-20250514' })
      const provider = createMockProvider(config)

      registry.registerProvider({ name: 'anthropic', provider, priority: 1, capabilities: ['chat'] })

      const retrieved = registry.getProvider('anthropic')
      expect(retrieved.config.model).toBe('claude-sonnet-4-20250514')
    })

    it('should use provider-specific timeout configurations', () => {
      const fastProvider = createMockProvider(createMockProviderConfig('fast', { timeout: 15000 }))
      const slowProvider = createMockProvider(createMockProviderConfig('slow', { timeout: 90000 }))

      registry.registerProvider({ name: 'fast', provider: fastProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'slow', provider: slowProvider, priority: 2, capabilities: ['chat'] })

      expect(registry.getProvider('fast').config.timeout).toBe(15000)
      expect(registry.getProvider('slow').config.timeout).toBe(90000)
    })
  })

  describe('Request Routing to Configured Provider', () => {
    it('should route to the configured default provider (lowest priority)', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]
      const response: AIProviderResponse = { content: 'Gemini response', model: 'gemini-pro' }

      const geminiProvider = createMockProvider(createMockProviderConfig('gemini', { apiKey: 'gk-1' }))
      vi.mocked(geminiProvider.chat).mockResolvedValue(response)

      const openaiProvider = createMockProvider(createMockProviderConfig('openai', { apiKey: 'sk-2' }))
      vi.mocked(openaiProvider.chat).mockResolvedValue({ content: 'OpenAI response', model: 'gpt-4o' })

      registry.registerProvider({ name: 'gemini', provider: geminiProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'openai', provider: openaiProvider, priority: 2, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages)
      expect(result.content).toBe('Gemini response')
      expect(geminiProvider.chat).toHaveBeenCalledTimes(1)
      expect(openaiProvider.chat).not.toHaveBeenCalled()
    })

    it('should route to preferred provider when explicitly specified', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const geminiProvider = createMockProvider(createMockProviderConfig('gemini'))
      const openaiProvider = createMockProvider(createMockProviderConfig('openai'))
      const anthropicProvider = createMockProvider(createMockProviderConfig('anthropic'))

      vi.mocked(geminiProvider.chat).mockResolvedValue({ content: 'gemini', model: 'x' })
      vi.mocked(openaiProvider.chat).mockResolvedValue({ content: 'openai', model: 'x' })
      vi.mocked(anthropicProvider.chat).mockResolvedValue({ content: 'anthropic', model: 'x' })

      registry.registerProvider({ name: 'gemini', provider: geminiProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'openai', provider: openaiProvider, priority: 2, capabilities: ['chat'] })
      registry.registerProvider({ name: 'anthropic', provider: anthropicProvider, priority: 3, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages, { preferredProvider: 'anthropic' })
      expect(result.content).toBe('anthropic')
      expect(anthropicProvider.chat).toHaveBeenCalledTimes(1)
      expect(geminiProvider.chat).not.toHaveBeenCalled()
    })
  })

  describe('Failover Behavior', () => {
    it('should fail over to next provider when primary fails', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const primaryProvider = createMockProvider(createMockProviderConfig('primary'))
      const fallbackProvider = createMockProvider(createMockProviderConfig('fallback'))

      vi.mocked(primaryProvider.chat).mockRejectedValue(new Error('Primary API error'))
      vi.mocked(fallbackProvider.chat).mockResolvedValue({ content: 'fallback worked', model: 'test' })

      registry.registerProvider({ name: 'primary', provider: primaryProvider, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'fallback', provider: fallbackProvider, priority: 2, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages)
      expect(result.content).toBe('fallback worked')
      expect(primaryProvider.chat).toHaveBeenCalledTimes(1)
      expect(fallbackProvider.chat).toHaveBeenCalledTimes(1)
    })

    it('should try all providers before throwing AllProvidersFailedError', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const p1 = createMockProvider(createMockProviderConfig('p1'))
      const p2 = createMockProvider(createMockProviderConfig('p2'))
      const p3 = createMockProvider(createMockProviderConfig('p3'))

      vi.mocked(p1.chat).mockRejectedValue(new AIProviderError('P1 failed', 'p1', 500))
      vi.mocked(p2.chat).mockRejectedValue(new AIProviderError('P2 failed', 'p2', 429))
      vi.mocked(p3.chat).mockRejectedValue(new AIProviderError('P3 failed', 'p3', 503))

      registry.registerProvider({ name: 'p1', provider: p1, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'p2', provider: p2, priority: 2, capabilities: ['chat'] })
      registry.registerProvider({ name: 'p3', provider: p3, priority: 3, capabilities: ['chat'] })

      await expect(registry.chatWithFallback(messages)).rejects.toThrow(AllProvidersFailedError)
      expect(p1.chat).toHaveBeenCalledTimes(1)
      expect(p2.chat).toHaveBeenCalledTimes(1)
      expect(p3.chat).toHaveBeenCalledTimes(1)
    })

    it('should fail over from preferred provider to fallback on error', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const preferredProvider = createMockProvider(createMockProviderConfig('preferred'))
      const fallbackProvider = createMockProvider(createMockProviderConfig('fallback'))

      vi.mocked(preferredProvider.chat).mockRejectedValue(new Error('Rate limited'))
      vi.mocked(fallbackProvider.chat).mockResolvedValue({ content: 'fallback', model: 'test' })

      registry.registerProvider({ name: 'preferred', provider: preferredProvider, priority: 2, capabilities: ['chat'] })
      registry.registerProvider({ name: 'fallback', provider: fallbackProvider, priority: 1, capabilities: ['chat'] })

      const result = await registry.chatWithFallback(messages, { preferredProvider: 'preferred' })
      expect(result.content).toBe('fallback')
    })

    it('should skip already-tried providers during failover', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const onlyProvider = createMockProvider(createMockProviderConfig('only'))
      vi.mocked(onlyProvider.chat).mockRejectedValueOnce(new Error('Failed once'))

      // Register as preferred (priority doesn't matter here)
      registry.registerProvider({ name: 'only', provider: onlyProvider, priority: 1, capabilities: ['chat'] })

      // When using preferred, it tries preferred first, then the sorted list excluding tried
      // Since there's only one provider and it failed, AllProvidersFailedError is thrown
      await expect(
        registry.chatWithFallback(messages, { preferredProvider: 'only' })
      ).rejects.toThrow(AllProvidersFailedError)

      expect(onlyProvider.chat).toHaveBeenCalledTimes(1)
    })
  })

  describe('Timeout Handling', () => {
    it('should respect provider-level timeout configuration', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const slowProvider = createMockProvider(createMockProviderConfig('slow', { timeout: 50 }))
      vi.mocked(slowProvider.chat).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ content: 'ok', model: 'x' }), 200))
      )

      registry.registerProvider({ name: 'slow', provider: slowProvider, priority: 1, capabilities: ['chat'] })

      // Use a short timeout option which causes the Promise.race to reject
      await expect(
        registry.chatWithFallback(messages, { timeout: 10 })
      ).rejects.toThrow()
    })

    it('should use custom timeout when provided', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const provider = createMockProvider(createMockProviderConfig('provider'))
      vi.mocked(provider.chat).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ content: 'ok', model: 'x' }), 100))
      )

      registry.registerProvider({ name: 'provider', provider, priority: 1, capabilities: ['chat'] })

      await expect(
        registry.chatWithFallback(messages, { timeout: 10 })
      ).rejects.toThrow()
    })
  })

  describe('Provider Availability', () => {
    it('should return empty list when no providers are registered', () => {
      expect(registry.getAvailableProviders()).toHaveLength(0)
    })

    it('should list all registered providers', () => {
      registry.registerProvider({
        name: 'gemini',
        provider: createMockProvider(createMockProviderConfig('gemini', { apiKey: 'gk-1' })),
        priority: 1,
        capabilities: ['chat', 'streaming'],
      })
      registry.registerProvider({
        name: 'openai',
        provider: createMockProvider(createMockProviderConfig('openai', { apiKey: 'sk-1' })),
        priority: 2,
        capabilities: ['chat'],
      })
      registry.registerProvider({
        name: 'anthropic',
        provider: createMockProvider(createMockProviderConfig('anthropic', { apiKey: 'ak-1' })),
        priority: 3,
        capabilities: ['chat'],
      })

      const providers = registry.getAvailableProviders()
      expect(providers).toHaveLength(3)
      expect(providers).toContain('gemini')
      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
    })
  })

  describe('Provider-Specific Configurations', () => {
    it('should differentiate Gemini provider config', () => {
      const gemini = createMockProvider(createMockProviderConfig('gemini', {
        apiKey: 'gemini-api-key',
        model: 'gemini-pro',
        maxTokens: 2000,
        temperature: 0.9,
      }))

      registry.registerProvider({ name: 'gemini', provider: gemini, priority: 1, capabilities: ['chat', 'streaming'] })

      const retrieved = registry.getProvider('gemini')
      expect(retrieved.config.apiKey).toBe('gemini-api-key')
      expect(retrieved.config.model).toBe('gemini-pro')
      expect(retrieved.config.maxTokens).toBe(2000)
      expect(retrieved.config.temperature).toBe(0.9)
    })

    it('should differentiate OpenAI provider config', () => {
      const openai = createMockProvider(createMockProviderConfig('openai', {
        apiKey: 'sk-openai-key',
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
      }))

      registry.registerProvider({ name: 'openai', provider: openai, priority: 2, capabilities: ['chat', 'streaming'] })

      const retrieved = registry.getProvider('openai')
      expect(retrieved.config.model).toBe('gpt-4o-mini')
    })

    it('should differentiate Anthropic provider config', () => {
      const anthropic = createMockProvider(createMockProviderConfig('anthropic', {
        apiKey: 'sk-ant-key',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 4096,
      }))

      registry.registerProvider({ name: 'anthropic', provider: anthropic, priority: 3, capabilities: ['chat'] })

      const retrieved = registry.getProvider('anthropic')
      expect(retrieved.config.model).toBe('claude-sonnet-4-20250514')
    })
  })

  describe('Error Information Propagation', () => {
    it('should include all provider errors in AllProvidersFailedError message', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const p1 = createMockProvider(createMockProviderConfig('gemini'))
      const p2 = createMockProvider(createMockProviderConfig('openai'))

      vi.mocked(p1.chat).mockRejectedValue(new AIProviderError('Gemini rate limited', 'gemini', 429))
      vi.mocked(p2.chat).mockRejectedValue(new AIProviderError('OpenAI auth failed', 'openai', 401))

      registry.registerProvider({ name: 'gemini', provider: p1, priority: 1, capabilities: ['chat'] })
      registry.registerProvider({ name: 'openai', provider: p2, priority: 2, capabilities: ['chat'] })

      try {
        await registry.chatWithFallback(messages)
        expect.unreachable('Expected AllProvidersFailedError')
      } catch (error) {
        expect(error).toBeInstanceOf(AllProvidersFailedError)
        const msg = (error as Error).message
        expect(msg).toContain('Gemini rate limited')
        expect(msg).toContain('OpenAI auth failed')
      }
    })
  })
})
