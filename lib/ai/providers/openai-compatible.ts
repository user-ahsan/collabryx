/**
 * Universal OpenAI-Compatible Provider
 * =====================================
 * Works with ANY OpenAI-compatible API endpoint:
 * - OpenAI, Groq, Together AI, OpenRouter
 * - Ollama, LM Studio, vLLM, LocalAI
 * - Any custom endpoint following OpenAI chat completions format
 */

import type { AIProvider, AIProviderConfig, AIProviderResponse, Message } from './base'
import { AIProviderError, RateLimitError, ProviderTimeoutError, StreamingError } from '@/lib/ai/errors'

export interface OpenAICompatibleConfig {
  name: string
  apiKey?: string
  baseURL: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  /** Extra headers to send with every request (for provider-specific auth) */
  extraHeaders?: Record<string, string>
  /** Whether to include the API key as Bearer token (default: true) */
  useBearerAuth?: boolean
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly config: AIProviderConfig
  private baseURL: string
  private extraHeaders: Record<string, string>
  private useBearerAuth: boolean

  constructor(config: OpenAICompatibleConfig) {
    if (!config.baseURL) {
      throw new Error('baseURL is required for OpenAICompatibleProvider')
    }

    this.baseURL = config.baseURL.replace(/\/+$/, '') // Remove trailing slashes
    this.extraHeaders = config.extraHeaders || {}
    this.useBearerAuth = config.useBearerAuth !== false

    this.config = {
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
      timeout: config.timeout || 60000,
    }
  }

  supportsStreaming(): boolean {
    return true
  }

  async chat(messages: Message[], systemPrompt?: string): Promise<AIProviderResponse> {
    // Build the message array once and cache it so retries only re-send the
    // network call, not re-construct the payload (which for OpenAI means re-
    // counting tokens and potentially triggering double billing on retries).
    const allMessages = this.buildMessages(messages, systemPrompt)
    const body = this.buildRequestBody(allMessages, false)

    const response = await this.withRetry(async () => {
      return this.makeRequestWithBody(body, false)
    })

    return this.parseChatResponse(response)
  }

  async *stream(messages: Message[], systemPrompt?: string): AsyncGenerator<string> {
    const allMessages = this.buildMessages(messages, systemPrompt)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, this.config.timeout)

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
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

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw this.buildError(response.status, errorBody)
      }

      if (!response.body) {
        throw new StreamingError('Response body is null', this.config.name)
      }

      yield* this.parseSSEStream(response.body)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderTimeoutError(
          `Request timed out after ${this.config.timeout}ms`,
          this.config.name,
          this.config.timeout
        )
      }
      throw error
    }
  }

  // --- Private helpers ---

  private buildMessages(messages: Message[], systemPrompt?: string): Message[] {
    const allMessages: Message[] = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    allMessages.push(...messages)
    return allMessages
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge extra headers first (may contain provider-specific auth)
    Object.assign(headers, this.extraHeaders)

    // Set Authorization AFTER extraHeaders so it always takes precedence
    if (this.useBearerAuth && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  /**
   * Build the request body once so retries re-send the same serialized payload.
   * This avoids re-counting tokens on every retry, preventing double billing.
   */
  private buildRequestBody(messages: Message[], streaming: boolean): string {
    return JSON.stringify({
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: streaming,
    })
  }

  private async makeRequestWithBody(
    body: string,
    streaming: false
  ): Promise<Record<string, unknown>>

  private async makeRequestWithBody(
    body: string,
    streaming: true
  ): Promise<Response>

  private async makeRequestWithBody(
    body: string,
    streaming: boolean
  ): Promise<Record<string, unknown> | Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw this.buildError(response.status, errorBody)
      }

      if (streaming) {
        return response
      }

      return response.json() as Promise<Record<string, unknown>>
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderTimeoutError(
          `Request timed out after ${this.config.timeout}ms`,
          this.config.name,
          this.config.timeout
        )
      }
      throw error
    }
  }

  private parseChatResponse(data: Record<string, unknown>): AIProviderResponse {
    const choices = data.choices as Array<{
      message?: { content?: string }
      finish_reason?: string
    }> | undefined

    const choice = choices?.[0]
    if (!choice) {
      throw new AIProviderError(
        'No response choices returned',
        this.config.name
      )
    }

    const content = choice.message?.content || ''
    const usage = data.usage as {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    } | undefined

    return {
      content,
      usage: usage ? {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      } : undefined,
      model: (data.model as string) || this.config.model,
      finishReason: choice.finish_reason,
    }
  }

  private async *parseSSEStream(body: ReadableStream): AsyncGenerator<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

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
      reader.releaseLock()
    }
  }

  private buildError(status: number, errorBody: Record<string, unknown>): Error {
    const message = (errorBody.error as { message?: string })?.message
      || (errorBody.message as string)
      || `API error: ${status}`

    const retryAfter = (errorBody as { retry_after?: number }).retry_after

    if (status === 429) {
      return new RateLimitError(
        message,
        this.config.name,
        retryAfter ? retryAfter * 1000 : undefined
      )
    }

    return new AIProviderError(message, this.config.name, status)
  }

  // NOTE: The request body is now built once in chat() and reused across retries via
  // buildRequestBody / makeRequestWithBody, so token counting only happens once.
  // API billing still occurs per HTTP attempt — consider idempotency keys for production.
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
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

        if (error instanceof RateLimitError && error.retryAfterMs) {
          retryAfterMs = error.retryAfterMs
          continue
        }

        if (error instanceof AIProviderError && error.statusCode) {
          if (error.statusCode >= 500) {
            retryAfterMs = Math.min(1000 * Math.pow(2, attempt), 10000)
            continue
          }
          // Client errors (4xx) are not retried
          throw error
        }

        throw error
      }
    }

    throw lastError
  }
}
