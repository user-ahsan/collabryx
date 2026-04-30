import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MiniMaxProvider } from '@/lib/ai/providers/minimax'
import { MiniMaxAPIError } from '@/lib/ai/errors'

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

describe('MiniMaxProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.MINIMAX_API_KEY
    delete process.env.MINIMAX_BASE_URL
    delete process.env.MINIMAX_MODEL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should throw when API key is missing', () => {
      expect(() => new MiniMaxProvider({})).toThrow('MINIMAX_API_KEY is not configured')
    })

    it('should accept API key from config', () => {
      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      expect(provider.config.apiKey).toBe('test-key')
    })

    it('should use default base URL when not specified', () => {
      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      expect((provider as unknown as { baseURL: string }).baseURL).toBe('https://api.minimaxi.com/v1')
    })

    it('should accept custom base URL', () => {
      const provider = new MiniMaxProvider({
        apiKey: 'test-key',
        baseURL: 'https://custom.minimaxi.com/v1',
      })
      expect((provider as unknown as { baseURL: string }).baseURL).toBe('https://custom.minimaxi.com/v1')
    })

    it('should use default model when not specified', () => {
      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      expect(provider.config.model).toBe('MiniMax-M2.7')
    })

    it('should accept custom model', () => {
      const provider = new MiniMaxProvider({
        apiKey: 'test-key',
        model: 'custom-model',
      })
      expect(provider.config.model).toBe('custom-model')
    })

    it('should read API key from environment variable', () => {
      process.env.MINIMAX_API_KEY = 'env-key'
      const provider = new MiniMaxProvider({})
      expect(provider.config.apiKey).toBe('env-key')
    })

    it('should use environment base URL when set', () => {
      process.env.MINIMAX_BASE_URL = 'https://env.minimaxi.com/v1'
      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      expect((provider as unknown as { baseURL: string }).baseURL).toBe('https://env.minimaxi.com/v1')
    })

    it('should use environment model when set', () => {
      process.env.MINIMAX_MODEL = 'env-model'
      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      expect(provider.config.model).toBe('env-model')
    })
  })

  describe('chat', () => {
    it('should return content correctly', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Hello, world!' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
        model: 'MiniMax-M2.7',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      const result = await provider.chat([{ role: 'user', content: 'Hi' }])

      expect(result.content).toBe('Hello, world!')
      expect(result.finishReason).toBe('stop')
      expect(result.model).toBe('MiniMax-M2.7')
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      })
    })

    it('should prepend system prompt to messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'response' }, finish_reason: 'stop' }],
          model: 'MiniMax-M2.7',
        }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      await provider.chat(
        [{ role: 'user', content: 'Hi' }],
        'You are a helpful assistant.'
      )

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body as string)
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hi' },
      ])
    })

    it('should throw MiniMaxAPIError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
        json: async () => ({ message: 'Unauthorized', code: 401 }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })

      await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
        MiniMaxAPIError
      )
    })

    it('should throw when no choices returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [],
          model: 'MiniMax-M2.7',
        }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })

      await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
        'No response choices returned from MiniMax API'
      )
    })
  })

  describe('stream', () => {
    it('should yield tokens as they arrive', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        'data: [DONE]\n',
      ]

      const mockStream = new ReadableStream({
        start(controller) {
          let index = 0
          const enqueue = () => {
            if (index < chunks.length) {
              controller.enqueue(new TextEncoder().encode(chunks[index]))
              index++
              if (index < chunks.length) {
                setTimeout(enqueue, 10)
              } else {
                controller.close()
              }
            }
          }
          enqueue()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      const tokens: string[] = []

      for await (const token of provider.stream([{ role: 'user', content: 'Hi' }])) {
        tokens.push(token)
      }

      expect(tokens).toEqual(['Hello', ' world'])
    })

    it('should handle empty delta content', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{}}]}\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n',
        'data: [DONE]\n',
      ]

      const mockStream = new ReadableStream({
        start(controller) {
          let index = 0
          const enqueue = () => {
            if (index < chunks.length) {
              controller.enqueue(new TextEncoder().encode(chunks[index]))
              index++
              if (index < chunks.length) {
                setTimeout(enqueue, 10)
              } else {
                controller.close()
              }
            }
          }
          enqueue()
        },
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      const tokens: string[] = []

      for await (const token of provider.stream([{ role: 'user', content: 'Hi' }])) {
        tokens.push(token)
      }

      expect(tokens).toEqual(['Hello', ' World'])
    })

    it('should throw MiniMaxAPIError on stream error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map(),
        json: async () => ({ message: 'Internal server error', code: 500 }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })

      await expect(provider.stream([{ role: 'user', content: 'Hi' }]).next()).rejects.toThrow(
        MiniMaxAPIError
      )
    })
  })

  describe('retry logic', () => {
    it('should retry on 500 errors and eventually succeed', async () => {
      let attempts = 0
      mockFetch.mockImplementation(() => {
        attempts++
        if (attempts < 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            headers: new Map(),
            json: async () => ({ message: 'Server error', code: 500 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
            model: 'MiniMax-M2.7',
          }),
        })
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      const result = await provider.chat([{ role: 'user', content: 'Hi' }])

      expect(result.content).toBe('Success')
      expect(attempts).toBe(2)
    }, 10000)

    it('should not retry on 400 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Map(),
        json: async () => ({ message: 'Bad request', code: 400 }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })

      await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
        MiniMaxAPIError
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle rate limit error after retries exhausted', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map(),
        json: async () => ({ message: 'Rate limit exceeded', code: 10001 }),
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })

      await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow(
        MiniMaxAPIError
      )
    }, 15000)

    it('should retry on 429 rate limit and eventually succeed', async () => {
      let attempts = 0
      mockFetch.mockImplementation(() => {
        attempts++
        if (attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map(),
            json: async () => ({ message: 'Rate limit exceeded', code: 10001 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
            model: 'MiniMax-M2.7',
          }),
        })
      })

      const provider = new MiniMaxProvider({ apiKey: 'test-key' })
      const result = await provider.chat([{ role: 'user', content: 'Hi' }])

      expect(result.content).toBe('Success')
      expect(attempts).toBe(2)
    }, 10000)
  })
})