import type { AIProvider, AIProviderConfig, AIProviderResponse, Message } from './base'
import { MiniMaxAPIError } from '@/lib/ai/errors'

export interface MiniMaxConfig {
  apiKey?: string
  baseURL?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export class MiniMaxProvider implements AIProvider {
  readonly config: AIProviderConfig
  private baseURL: string

  constructor(config: MiniMaxConfig = {}) {
    const apiKey = config.apiKey || process.env.MINIMAX_API_KEY
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY is not configured')
    }

    this.baseURL = config.baseURL || process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'

    this.config = {
      name: 'minimax',
      apiKey,
      model: config.model || process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 60000,
    }
  }

  async chat(messages: Message[], systemPrompt?: string): Promise<AIProviderResponse> {
    const allMessages: Message[] = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    allMessages.push(...messages)

    const response = await this.withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: allMessages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}))
          const retryAfter = res.headers.get('Retry-After')
          const errorCode = (errorBody as { code?: number }).code

          if (res.status === 429) {
            throw new MiniMaxAPIError(
              errorBody.message || 'Rate limit exceeded',
              res.status,
              errorCode
            )
          }

          throw new MiniMaxAPIError(
            errorBody.message || `MiniMax API error: ${res.status}`,
            res.status,
            errorCode
          )
        }

        return res.json()
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    })

    const data = response as {
      choices: Array<{
        message: { content: string }
        finish_reason: string
      }>
      usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
      model: string
    }

    const choice = data.choices[0]

    if (!choice) {
      throw new MiniMaxAPIError('No response choices returned from MiniMax API')
    }

    return {
      content: choice.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model || this.config.model,
      finishReason: choice.finish_reason,
    }
  }

  async *stream(messages: Message[], systemPrompt?: string): AsyncGenerator<string> {
    const allMessages: Message[] = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    allMessages.push(...messages)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: allMessages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        const errorCode = (errorBody as { code?: number }).code

        if (res.status === 429) {
          throw new MiniMaxAPIError(
            errorBody.message || 'Rate limit exceeded',
            res.status,
            errorCode
          )
        }

        throw new MiniMaxAPIError(
          errorBody.message || `MiniMax API error: ${res.status}`,
          res.status,
          errorCode
        )
      }

      if (!res.body) {
        throw new MiniMaxAPIError('Response body is null')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()

          if (!trimmed || trimmed === 'data: [DONE]') {
            continue
          }

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: { content?: string }
                  finish_reason?: string
                }>
              }

              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | undefined
    let retryAfterMs = 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0 && retryAfterMs > 0) {
        await new Promise(resolve => setTimeout(resolve, retryAfterMs))
        retryAfterMs = 0
      }

      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (error instanceof MiniMaxAPIError) {
          if (error.statusCode === 429) {
            const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000)
            retryAfterMs = baseDelay
            continue
          }

          if (error.statusCode && error.statusCode >= 500) {
            const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000)
            retryAfterMs = baseDelay
            continue
          }
        }

        throw error
      }
    }

    throw lastError
  }
}
