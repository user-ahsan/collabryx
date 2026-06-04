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
 * - openrouter  (5):  Tried first — OpenRouter with DeepSeek V4 Flash (or any model)
 * - minimax    (10):  Fast/cheap fallback, suitable for simple tasks
 * - openai     (20):  Default fallback — balanced capability and cost
 * - anthropic  (30):  Last resort — most capable/powerful model for complex tasks
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

// OpenRouter — primary provider (highest priority, tried first)
// Uses OpenAI-compatible format with recommended identity headers
if (process.env.OPENROUTER_API_KEY && !registry.getAvailableProviders().includes('openrouter')) {
  const openRouterHeaders: Record<string, string> = {
    'HTTP-Referer': process.env['OPENROUTER_REFERER'] || process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
    'X-OpenRouter-Title': process.env['OPENROUTER_TITLE'] || 'Collabryx',
  }

  registry.registerProvider({
    name: 'openrouter',
    provider: new OpenAICompatibleProvider({
      name: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash',
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '8192', 10),
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '120000', 10),
      extraHeaders: openRouterHeaders,
    }),
    priority: 5,
    capabilities: ['chat', 'streaming'],
  })
}

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
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '8192', 10),
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
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '8192', 10),
      temperature: 0.7,
      timeout: 60000,
    }),
    priority: 30,
    capabilities: ['chat', 'streaming']
  })
}

export { registry as providerRegistry }
export { ProviderRegistry } from './registry'
