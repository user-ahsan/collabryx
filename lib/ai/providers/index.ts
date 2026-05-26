/**
 * AI Provider Registration
 * =========================
 * Registers all available AI providers with the global registry.
 *
 * Registration order:
 * 1. Environment-based providers (AI_PROVIDER_N_*) via autoRegisterProviders
 * 2. Legacy hardcoded providers (for backward compatibility)
 *
 * Priority ordering rationale:
 * Lower priority number = HIGHER priority (tried first during fallback).
 * - minimax (10): Tried first — fastest/cheapest model, suitable for simple tasks
 * - openai   (20): Default fallback — balanced capability and cost
 * - anthropic (30): Last resort — most capable/powerful model for complex tasks
 *
 * This inverted scheme (lower=higher) allows inserting new providers at any
 * priority level without renumbering existing entries.
 */

import { ProviderRegistry, autoRegisterProviders } from './registry'
import { MiniMaxProvider } from './minimax'
import { OpenAICompatibleProvider } from './openai-compatible'
import { AnthropicNativeProvider } from './anthropic-native'

const registry = new ProviderRegistry()

// Step 1: Auto-register from environment variables (AI_PROVIDER_N_*)
autoRegisterProviders(registry)

// Step 2: Register legacy providers if env vars exist and not already registered
// These provide backward compatibility for existing deployments

if (process.env.MINIMAX_API_KEY && !registry.getAvailableProviders().includes('minimax')) {
  registry.registerProvider({
    name: 'minimax',
    provider: new MiniMaxProvider({
      apiKey: process.env.MINIMAX_API_KEY,
      baseURL: process.env.MINIMAX_BASE_URL,
      model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7'
    }),
    priority: 10,
    capabilities: ['chat', 'streaming']
  })
}

if (process.env.OPENAI_API_KEY && !registry.getAvailableProviders().includes('openai')) {
  registry.registerProvider({
    name: 'openai',
    provider: new OpenAICompatibleProvider({
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 60000,
    }),
    priority: 20,
    capabilities: ['chat', 'streaming']
  })
}

if (process.env.ANTHROPIC_API_KEY && !registry.getAvailableProviders().includes('anthropic')) {
  registry.registerProvider({
    name: 'anthropic',
    provider: new AnthropicNativeProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 60000,
    }),
    priority: 30,
    capabilities: ['chat', 'streaming']
  })
}

export { registry as providerRegistry }
export { ProviderRegistry } from './registry'
