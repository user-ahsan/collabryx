import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSSEStream, streamToResponse, createMessageStream } from '@/lib/ai/streaming'
import type { AIProvider, Message } from '@/lib/ai/providers/base'

describe('Streaming Utilities', () => {
  describe('createSSEStream', () => {
    it('should yield SSE-formatted tokens', async () => {
      const text = 'Hello World'
      const stream = createSSEStream(text)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      const tokens: string[] = []
      let result = await reader.read()

      while (!result.done) {
        const chunk = decoder.decode(result.value)
        tokens.push(chunk)
        result = await reader.read()
      }

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0]).toContain('data:')
      expect(tokens[0]).toContain('"content":')
    })

    it('should end with [DONE]', async () => {
      const text = 'Hi'
      const stream = createSSEStream(text)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      let lastChunk = ''
      let result = await reader.read()

      while (!result.done) {
        lastChunk = decoder.decode(result.value)
        result = await reader.read()
      }

      expect(lastChunk).toContain('data: [DONE]')
    })
  })

  describe('streamToResponse', () => {
    it('should set correct SSE headers', () => {
      const stream = new ReadableStream()
      const response = streamToResponse(stream)

      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Connection')).toBe('keep-alive')
      expect(response.headers.get('X-Accel-Buffering')).toBe('no')
    })

    it('should return a Response object', () => {
      const stream = new ReadableStream()
      const response = streamToResponse(stream)

      expect(response).toBeInstanceOf(Response)
    })
  })

  describe('createMessageStream', () => {
    const mockProvider: AIProvider = {
      config: {
        name: 'test',
        model: 'test-model',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000
      },
      chat: vi.fn(),
      stream: vi.fn()
    }

    const mockMessages: Message[] = [
      { role: 'user', content: 'Hello' }
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return a Response object', async () => {
      const mockStream = new ReadableStream()
      mockProvider.stream = vi.fn().mockReturnValue(mockStream as unknown as AsyncGenerator<string>)

      const response = await createMessageStream(mockMessages, mockProvider)

      expect(response).toBeInstanceOf(Response)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    })

    it('should handle provider without streaming support', async () => {
      const providerNoStream: AIProvider = {
        config: {
          name: 'test',
          model: 'test-model',
          maxTokens: 1000,
          temperature: 0.7,
          timeout: 30000
        },
        chat: vi.fn()
      }

      const response = await createMessageStream(mockMessages, providerNoStream)

      expect(response).toBeInstanceOf(Response)
    })

    it('should transform stream to SSE format', async () => {
      const encoder = new TextEncoder()

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Hello'))
          controller.enqueue(encoder.encode(' World'))
          controller.close()
        }
      })

      mockProvider.stream = vi.fn().mockReturnValue(mockStream as unknown as AsyncGenerator<string>)

      const response = await createMessageStream(mockMessages, mockProvider)
      expect(response).toBeInstanceOf(Response)
    })
  })
})
