import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retrieveContextFromVectorStore } from '@/lib/rag/vector-retriever'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn()
  }))
}))

vi.mock('openai', () => {
  const mockOpenAI = {
    embeddings: {
      create: vi.fn()
    }
  }
  return { default: vi.fn(() => mockOpenAI) }
})

describe('vector-retriever', () => {
  describe('retrieveContextFromVectorStore', () => {
    const mockEmbedding = Array(384).fill(0.5)

    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should combine vector and keyword scores correctly', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          {
            user_id: 'user-1',
            display_name: 'Alice',
            headline: 'React Developer',
            bio: '5 years experience',
            similarity: 0.9,
            looking_for: ['mentorship'],
            skills: [{ skill_name: 'React' }],
            interests: [{ interest: 'AI' }]
          }
        ],
        error: null
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          { id: 'user-1', display_name: 'Alice', headline: 'React Developer', bio: '5 years experience', looking_for: ['mentorship'], skills: [{ skill_name: 'React' }], interests: [{ interest: 'AI' }] },
          { id: 'user-2', display_name: 'Bob', headline: 'Backend Engineer', bio: '3 years experience', looking_for: ['collaboration'], skills: [{ skill_name: 'Node' }], interests: [{ interest: 'Databases' }] }
        ],
        error: null
      })

      const result = await retrieveContextFromVectorStore('React developer', 'current-user')

      expect(result.contexts.length).toBeGreaterThan(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle vector search failure and fallback to keyword only', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Database connection failed'))

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          { id: 'user-2', display_name: 'Bob', headline: 'Backend Engineer', bio: 'Node.js developer', looking_for: ['collaboration'], skills: [{ skill_name: 'Node' }], interests: [{ interest: 'Databases' }] }
        ],
        error: null
      })

      const result = await retrieveContextFromVectorStore('backend developer', 'current-user')

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Vector search failed')
    })

    it('should handle embedding generation failure gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockRejectedValue(
        new Error('OpenAI API error')
      )

      const result = await retrieveContextFromVectorStore('test query', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Failed to generate query embedding')
    })

    it('should return empty array when both searches fail', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Database error'))
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Database error'))

      const result = await retrieveContextFromVectorStore('test', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should use custom weights when provided', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          {
            user_id: 'user-1',
            display_name: 'Alice',
            headline: 'Full Stack Developer',
            similarity: 0.8,
            looking_for: [],
            skills: [],
            interests: [],
            bio: null
          }
        ],
        error: null
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          { id: 'user-1', display_name: 'Alice', headline: 'Full Stack Developer', bio: null, looking_for: [], skills: [], interests: [] }
        ],
        error: null
      })

      const result = await retrieveContextFromVectorStore('full stack', 'current-user', {
        vectorWeight: 0.9,
        keywordWeight: 0.1
      })

      expect(result.contexts.length).toBeGreaterThan(0)
    })

    it('should handle database query returning no results', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { OpenAI } = await import('openai')

      const mockSupabaseClient = {
        rpc: vi.fn()
      }
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      ;(OpenAI as unknown as { embeddings: { create: ReturnType<typeof vi.fn> } }).embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })

      const result = await retrieveContextFromVectorStore('nonexistent query xyz', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.some(w => w.includes('No relevant context found'))).toBe(true)
    })
  })
})