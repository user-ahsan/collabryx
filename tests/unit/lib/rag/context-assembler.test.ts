import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AIMessage } from '@/lib/rag/types'

vi.mock('@/lib/rag/context-fetcher', () => ({
  fetchUserProfileContext: vi.fn(),
}))

vi.mock('@/lib/rag/vector-retriever', () => ({
  retrieveContextFromVectorStore: vi.fn(),
}))

vi.mock('@/lib/rag/session-summarizer', () => ({
  summarizeSessionIfNeeded: vi.fn(),
}))

vi.mock('@/lib/prompt/ai-mentor-prompts', () => ({
  buildEnhancedSystemPrompt: vi.fn(),
  buildFallbackSystemPrompt: vi.fn(),
}))

describe('context-assembler', () => {
  const mockUserId = 'user-123'
  const mockQuery = 'How do I improve my networking skills?'
  const mockSessionId = 'session-456'
  const mockMessages: AIMessage[] = [
    { id: '1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
    { id: '2', role: 'assistant', content: 'Hi there!', created_at: '2024-01-01T00:01:00Z' },
  ]

  const mockProfile = {
    user_id: mockUserId,
    display_name: 'Test User',
    headline: 'Software Engineer',
    bio: 'Building things',
    looking_for: ['networking', 'collaboration'],
    skills: [{ skill_name: 'TypeScript' }],
    interests: [{ interest: 'AI' }],
    career_level: 'mid-career' as const,
    location: 'San Francisco',
  }

  const mockRetrievedContexts = [
    { content: 'Networking tips', score: 0.9, source: 'vector' as const },
  ]

  const mockSummary = {
    summary_text: 'User is learning about networking',
    action_items: ['Practice introductions'],
    skills_identified: ['networking'],
    message_count: 8,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assembleRAGContext', () => {
    it('should assemble context from all sources', async () => {
      const { assembleRAGContext } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: mockProfile,
        error: null,
        warnings: [],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: mockRetrievedContexts,
        warnings: [],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: mockSummary,
        warnings: [],
      })

      const result = await assembleRAGContext(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.profile).toEqual(mockProfile)
      expect(result.retrieved_contexts).toEqual(mockRetrievedContexts)
      expect(result.session_summary).toEqual(mockSummary)
      expect(result.conversation_history).toEqual(mockMessages.slice(-10))
      expect(result.assembled_at).toBeDefined()
    })

    it('should continue when profile fetch fails', async () => {
      const { assembleRAGContext } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: null,
        error: new Error('Profile not found'),
        warnings: ['Profile fetch failed'],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: mockRetrievedContexts,
        warnings: [],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: mockSummary,
        warnings: [],
      })

      const result = await assembleRAGContext(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.profile).toBeNull()
      expect(result.retrieved_contexts).toEqual(mockRetrievedContexts)
    })

    it('should continue when vector search fails', async () => {
      const { assembleRAGContext } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: mockProfile,
        error: null,
        warnings: [],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: [],
        warnings: ['Vector search failed'],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: mockSummary,
        warnings: [],
      })

      const result = await assembleRAGContext(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.profile).toEqual(mockProfile)
      expect(result.retrieved_contexts).toEqual([])
    })

    it('should continue when summarization fails', async () => {
      const { assembleRAGContext } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: mockProfile,
        error: null,
        warnings: [],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: mockRetrievedContexts,
        warnings: [],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: null,
        warnings: ['Summarization failed'],
      })

      const result = await assembleRAGContext(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.profile).toEqual(mockProfile)
      expect(result.session_summary).toBeNull()
    })

    it('should limit conversation history to last 10 messages', async () => {
      const { assembleRAGContext } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: null,
        error: null,
        warnings: [],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: [],
        warnings: [],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: null,
        warnings: [],
      })

      const longMessages: AIMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
      }))

      const result = await assembleRAGContext(mockUserId, mockQuery, mockSessionId, longMessages)

      expect(result.conversation_history).toHaveLength(10)
      expect(result.conversation_history[0].id).toBe('5')
    })
  })

  describe('assembleAndBuildPrompt', () => {
    it('should call buildEnhancedSystemPrompt with assembled context', async () => {
      const { assembleAndBuildPrompt } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')
      const aiMentorPrompts = await import('@/lib/prompt/ai-mentor-prompts')

      const mockSystemPrompt = 'Enhanced prompt with context'

      vi.mocked(contextFetcher.fetchUserProfileContext).mockResolvedValue({
        data: mockProfile,
        error: null,
        warnings: [],
      })
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockResolvedValue({
        contexts: mockRetrievedContexts,
        warnings: [],
      })
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockResolvedValue({
        summary: mockSummary,
        warnings: [],
      })
      vi.mocked(aiMentorPrompts.buildEnhancedSystemPrompt).mockReturnValue(mockSystemPrompt)

      const result = await assembleAndBuildPrompt(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(aiMentorPrompts.buildEnhancedSystemPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: mockProfile,
          retrieved_contexts: mockRetrievedContexts,
          session_summary: mockSummary,
        }),
        mockQuery
      )
      expect(result.systemPrompt).toBe(mockSystemPrompt)
      expect(result.context.profile).toEqual(mockProfile)
    })

    it('should return fallback prompt on assembly failure', async () => {
      const { assembleAndBuildPrompt } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const aiMentorPrompts = await import('@/lib/prompt/ai-mentor-prompts')

      const mockFallbackPrompt = 'Fallback prompt'

      vi.mocked(contextFetcher.fetchUserProfileContext).mockRejectedValue(new Error('DB error'))
      vi.mocked(aiMentorPrompts.buildFallbackSystemPrompt).mockReturnValue(mockFallbackPrompt)

      const result = await assembleAndBuildPrompt(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.systemPrompt).toBe(mockFallbackPrompt)
      expect(result.context.profile).toBeNull()
      expect(result.context.retrieved_contexts).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should handle all failures gracefully', async () => {
      const { assembleAndBuildPrompt } = await import('@/lib/rag/context-assembler')
      const contextFetcher = await import('@/lib/rag/context-fetcher')
      const vectorRetriever = await import('@/lib/rag/vector-retriever')
      const sessionSummarizer = await import('@/lib/rag/session-summarizer')
      const aiMentorPrompts = await import('@/lib/prompt/ai-mentor-prompts')

      const mockFallbackPrompt = 'Fallback prompt'

      vi.mocked(contextFetcher.fetchUserProfileContext).mockRejectedValue(new Error('Profile error'))
      vi.mocked(vectorRetriever.retrieveContextFromVectorStore).mockRejectedValue(new Error('Vector error'))
      vi.mocked(sessionSummarizer.summarizeSessionIfNeeded).mockRejectedValue(new Error('Summary error'))
      vi.mocked(aiMentorPrompts.buildFallbackSystemPrompt).mockReturnValue(mockFallbackPrompt)

      const result = await assembleAndBuildPrompt(mockUserId, mockQuery, mockSessionId, mockMessages)

      expect(result.context.profile).toBeNull()
      expect(result.context.retrieved_contexts).toEqual([])
      expect(result.context.session_summary).toBeNull()
      expect(result.context.conversation_history).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})
