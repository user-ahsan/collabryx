import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIStream } from '@/hooks/use-ai-stream'

vi.mock('@/lib/rag/types', () => ({
  AIMessage: vi.fn()
}))

const createMockResponse = (chunks: string[], done = true) => {
  const encoder = new TextEncoder()
  let index = 0
  
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: vi.fn().mockImplementation(() => {
          if (index < chunks.length) {
            const chunk = encoder.encode(chunks[index])
            index++
            return Promise.resolve({ done: false, value: chunk })
          }
          return Promise.resolve({ done, value: new Uint8Array() })
        })
      })
    }
  }
}

describe('useAIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty messages array', () => {
      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))
      expect(result.current.messages).toEqual([])
    })

    it('should not be streaming initially', () => {
      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))
      expect(result.current.isStreaming).toBe(false)
    })

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))
      expect(result.current.error).toBeNull()
    })
  })

  describe('sendMessage', () => {
    it('should add user message to messages array', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(['data: [DONE]\n\n'])
      )

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Hello AI')
      })

      const userMessage = result.current.messages[0]
      expect(userMessage.role).toBe('user')
      expect(userMessage.content).toBe('Hello AI')
    })

    it('should add assistant message after streaming completes', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse([
          'data: {"content":"Hello"}\n\n',
          'data: [DONE]\n\n'
        ])
      )

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      const assistantMessage = result.current.messages[1]
      expect(assistantMessage.role).toBe('assistant')
      expect(assistantMessage.content).toBe('Hello')
    })

    it('should accumulate streamed content', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse([
          'data: {"content":"Hello"}\n\n',
          'data: {"content":" World"}\n\n',
          'data: [DONE]\n\n'
        ])
      )

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      const assistantMessage = result.current.messages[1]
      expect(assistantMessage.content).toBe('Hello World')
    })
  })

  describe('error handling', () => {
    it('should store error when fetch fails with non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('500')
    })

    it('should call onError callback when provided', async () => {
      const onError = vi.fn()

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error'
      })

      const { result } = renderHook(() =>
        useAIStream({ userId: 'user-123', onError })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network failure')
    })
  })

  describe('callbacks', () => {
    it('should call onChunk for each streamed chunk', async () => {
      const onChunk = vi.fn()

      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse([
          'data: {"content":"Hello"}\n\n',
          'data: {"content":" World"}\n\n',
          'data: [DONE]\n\n'
        ])
      )

      const { result } = renderHook(() =>
        useAIStream({ userId: 'user-123', onChunk })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello')
      expect(onChunk).toHaveBeenNthCalledWith(2, ' World')
    })

    it('should call onComplete with full content', async () => {
      const onComplete = vi.fn()

      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse([
          'data: {"content":"Full response"}\n\n',
          'data: [DONE]\n\n'
        ])
      )

      const { result } = renderHook(() =>
        useAIStream({ userId: 'user-123', onComplete })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(onComplete).toHaveBeenCalledWith('Full response')
    })
  })

  describe('message structure', () => {
    it('should create messages with required fields', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse(['data: [DONE]\n\n'])
      )

      const { result } = renderHook(() => useAIStream({ userId: 'user-123' }))

      await act(async () => {
        await result.current.sendMessage('Test message')
      })

      const userMessage = result.current.messages[0]
      expect(userMessage.id).toBeDefined()
      expect(typeof userMessage.id).toBe('string')
      expect(userMessage.role).toBe('user')
      expect(userMessage.content).toBe('Test message')
      expect(userMessage.created_at).toBeDefined()
    })
  })
})