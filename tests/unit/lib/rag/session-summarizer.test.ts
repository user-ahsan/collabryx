import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AIMessage } from '@/lib/rag/types'
import { summarizeSessionIfNeeded, setLLMClient, resetLLMClient } from '@/lib/rag/session-summarizer'
import type { LLMClient } from '@/lib/rag/session-summarizer'

type MockLLMClient = {
  chatCompletionsCreate: ReturnType<typeof vi.fn>
}

describe('session-summarizer', () => {
  let mockClient: MockLLMClient

  beforeEach(() => {
    vi.clearAllMocks()
    resetLLMClient()
    mockClient = {
      chatCompletionsCreate: vi.fn()
    }
    setLLMClient(mockClient as unknown as LLMClient)
  })

  afterEach(() => {
    resetLLMClient()
  })

  describe('summarizeSessionIfNeeded', () => {
    it('should NOT trigger summarization when messages < 8', async () => {
      const messages: AIMessage[] = Array.from({ length: 7 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings).toHaveLength(0)
      expect(mockClient.chatCompletionsCreate).not.toHaveBeenCalled()
    })

    it('should NOT trigger summarization when messages === 7', async () => {
      const messages: AIMessage[] = Array.from({ length: 7 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings).toHaveLength(0)
    })

    it('should trigger summarization when messages >= 8', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test summary',
                action_items: ['Action 1'],
                skills_identified: ['TypeScript']
              })
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(mockClient.chatCompletionsCreate).toHaveBeenCalledTimes(1)
      expect(result.summary).not.toBeNull()
      expect(result.summary?.summary_text).toBe('Test summary')
    })

    it('should only summarize last 10 messages when messages > 10', async () => {
      const messages: AIMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Summarized last 10 messages',
                action_items: [],
                skills_identified: []
              })
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary?.message_count).toBe(10)
    })

    it('should parse JSON response correctly', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'User discussed career goals and learning React',
                action_items: ['Review React documentation', 'Build sample project'],
                skills_identified: ['React', 'JavaScript', 'Career Planning']
              })
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).not.toBeNull()
      expect(result.summary?.summary_text).toBe('User discussed career goals and learning React')
      expect(result.summary?.action_items).toHaveLength(2)
      expect(result.summary?.skills_identified).toHaveLength(3)
    })

    it('should handle LLM failure gracefully', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockRejectedValueOnce(new Error('API Error: Rate limited'))

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Summarization failed')
    })

    it('should handle empty LLM response gracefully', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: ''
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings).toContain('Empty response from summarization LLM')
    })

    it('should handle malformed JSON gracefully', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'This is not JSON'
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings).toContain('Failed to parse summarization response')
    })

    it('should use gpt-3.5-turbo model', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test',
                action_items: [],
                skills_identified: []
              })
            }
          }
        ]
      })

      await summarizeSessionIfNeeded(messages, 'session-1')

      expect(mockClient.chatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo'
        })
      )
    })

    it('should limit summary to 300 tokens', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test',
                action_items: [],
                skills_identified: []
              })
            }
          }
        ]
      })

      await summarizeSessionIfNeeded(messages, 'session-1')

      expect(mockClient.chatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 300
        })
      )
    })

    it('should return warnings when LLM call fails', async () => {
      const messages: AIMessage[] = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockRejectedValueOnce(new Error('Connection timeout'))

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).toBeNull()
      expect(result.warnings.some(w => w.includes('Connection timeout'))).toBe(true)
    })

    it('should include user/assistant role labels in prompt', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test',
                action_items: [],
                skills_identified: []
              })
            }
          }
        ]
      })

      await summarizeSessionIfNeeded(messages, 'session-1')

      const callArgs = mockClient.chatCompletionsCreate.mock.calls[0][0]
      expect(callArgs.messages[0].content).toContain('User:')
      expect(callArgs.messages[0].content).toContain('Assistant:')
    })

    it('should filter out non-string items in action_items and skills_identified', async () => {
      const messages: AIMessage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString()
      }))

      mockClient.chatCompletionsCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test summary',
                action_items: ['item1', 123, 'item2', null],
                skills_identified: ['skill1', undefined, 'skill2']
              })
            }
          }
        ]
      })

      const result = await summarizeSessionIfNeeded(messages, 'session-1')

      expect(result.summary).not.toBeNull()
      expect(result.summary?.action_items).toHaveLength(2)
      expect(result.summary?.action_items).toContain('item1')
      expect(result.summary?.action_items).toContain('item2')
      expect(result.summary?.skills_identified).toHaveLength(2)
      expect(result.summary?.skills_identified).toContain('skill1')
      expect(result.summary?.skills_identified).toContain('skill2')
    })
  })
})