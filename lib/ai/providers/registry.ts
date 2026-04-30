import type { AIProvider, Message, AIProviderResponse } from './base'
import { AllProvidersFailedError, AIProviderError } from '@/lib/ai/errors'

export interface ProviderConfig {
  name: string
  provider: AIProvider
  priority: number
  capabilities: string[]
}

export class ProviderRegistry {
  private providers: Map<string, ProviderConfig> = new Map()
  private defaultProvider: string | null = null

  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, config)
    if (!this.defaultProvider || config.priority < this.providers.get(this.defaultProvider)!.priority) {
      this.defaultProvider = config.name
    }
  }

  getProvider(name?: string): AIProvider {
    if (name) {
      const provider = this.providers.get(name)
      if (!provider) throw new Error(`Provider ${name} not found`)
      return provider.provider
    }
    if (!this.defaultProvider) throw new Error('No providers registered')
    return this.providers.get(this.defaultProvider)!.provider
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async chatWithFallback(
    messages: Message[],
    options?: { preferredProvider?: string; timeout?: number }
  ): Promise<AIProviderResponse> {
    const errors: Array<{ provider: string; error: Error }> = []
    const triedProviders: string[] = []

    if (options?.preferredProvider && this.providers.has(options.preferredProvider)) {
      const preferred = this.providers.get(options.preferredProvider)!
      triedProviders.push(preferred.name)
      try {
        return await this.executeWithTimeout(
          preferred.provider.chat.bind(preferred.provider),
          messages,
          options.timeout
        )
      } catch (error) {
        errors.push({ provider: preferred.name, error: error as Error })
      }
    }

    const sortedProviders = Array.from(this.providers.values())
      .filter(p => !triedProviders.includes(p.name))
      .sort((a, b) => a.priority - b.priority)

    for (const providerConfig of sortedProviders) {
      triedProviders.push(providerConfig.name)
      try {
        return await this.executeWithTimeout(
          providerConfig.provider.chat.bind(providerConfig.provider),
          messages,
          options?.timeout
        )
      } catch (error) {
        errors.push({ provider: providerConfig.name, error: error as Error })
      }
    }

    const errorDetails = errors
      .map(e => `${e.provider}: ${e.error.message}`)
      .join('; ')
    const finalError = new AllProvidersFailedError()
    finalError.message = `All AI providers failed. Errors: ${errorDetails}`
    throw finalError
  }

  private async executeWithTimeout(
    chatFn: (messages: Message[], systemPrompt?: string) => Promise<AIProviderResponse>,
    messages: Message[],
    timeoutMs?: number
  ): Promise<AIProviderResponse> {
    if (timeoutMs) {
      return Promise.race([
        chatFn(messages),
        new Promise<AIProviderResponse>((_, reject) =>
          setTimeout(() => reject(new Error('Provider timeout')), timeoutMs)
        )
      ])
    }
    return chatFn(messages)
  }
}

let globalRegistry: ProviderRegistry | null = null

export function getProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry()
  }
  return globalRegistry
}