import type { AIProvider, Message, AIProviderResponse } from './base'
import { AllProvidersFailedError } from '@/lib/ai/errors'
import { OpenAICompatibleProvider } from './openai-compatible'
import { AnthropicNativeProvider } from './anthropic-native'

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
    options?: { preferredProvider?: string; timeout?: number; systemPrompt?: string }
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
          options.systemPrompt,
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
          options?.systemPrompt,
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
    systemPrompt?: string,
    timeoutMs?: number
  ): Promise<AIProviderResponse> {
    if (timeoutMs) {
      const controller = new AbortController()
      const timeoutPromise = new Promise<AIProviderResponse>((_, reject) =>
        setTimeout(() => {
          controller.abort()
          reject(new Error('Provider timeout'))
        }, timeoutMs)
      )
      return Promise.race([
        systemPrompt ? chatFn(messages, systemPrompt) : chatFn(messages),
        timeoutPromise,
      ])
    }
    return systemPrompt ? chatFn(messages, systemPrompt) : chatFn(messages)
  }
}

/**
 * Auto-register providers from environment variables.
 * Supports pattern: AI_PROVIDER_N_NAME, AI_PROVIDER_N_API_KEY, etc.
 */
export function autoRegisterProviders(registry: ProviderRegistry): void {
  let index = 1

  while (true) {
    const name = process.env[`AI_PROVIDER_${index}_NAME`]
    if (!name) break

    const apiKey = process.env[`AI_PROVIDER_${index}_API_KEY`]
    const baseURL = process.env[`AI_PROVIDER_${index}_BASE_URL`]
    const model = process.env[`AI_PROVIDER_${index}_MODEL`]
    const maxTokens = parseInt(process.env[`AI_PROVIDER_${index}_MAX_TOKENS`] || '4096', 10)
    const temperature = parseFloat(process.env[`AI_PROVIDER_${index}_TEMPERATURE`] || '0.7')
    const timeout = parseInt(process.env[`AI_PROVIDER_${index}_TIMEOUT`] || '60000', 10)
    const priority = parseInt(process.env[`AI_PROVIDER_${index}_PRIORITY`] || String(index), 10)

    if (!apiKey) {
      console.warn(`⚠️ AI_PROVIDER_${index}_API_KEY not set, skipping provider ${name}`)
      index++
      continue
    }

    if (!baseURL) {
      console.warn(`⚠️ AI_PROVIDER_${index}_BASE_URL not set, skipping provider ${name}`)
      index++
      continue
    }

    try {
      // Anthropic native API uses different endpoint pattern
      if (baseURL.includes('anthropic.com')) {
        const provider = new AnthropicNativeProvider({
          apiKey,
          model,
          maxTokens,
          temperature,
          timeout,
        })

        registry.registerProvider({
          name,
          provider,
          priority,
          capabilities: ['chat', 'streaming'],
        })
      } else {
        // All other providers use OpenAI-compatible format
        const provider = new OpenAICompatibleProvider({
          name,
          apiKey,
          baseURL,
          model: model || 'gpt-4o-mini',
          maxTokens,
          temperature,
          timeout,
        })

        registry.registerProvider({
          name,
          provider,
          priority,
          capabilities: ['chat', 'streaming'],
        })
      }

      console.log(`✅ Registered AI provider: ${name} (priority: ${priority})`)
    } catch (error) {
      console.warn(`⚠️ Failed to register provider ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    index++
  }
}

let globalRegistry: ProviderRegistry | null = null

export function getProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry()
    autoRegisterProviders(globalRegistry)
  }
  return globalRegistry
}