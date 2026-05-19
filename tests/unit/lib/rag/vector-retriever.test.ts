import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retrieveContextFromVectorStore } from '@/lib/rag/vector-retriever'

// Create mock chain for Supabase query builder
const createMockQueryBuilder = () => {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null })
  }
  return queryBuilder
}

const createMockSupabaseClient = () => ({
  from: vi.fn().mockReturnValue(createMockQueryBuilder()),
  rpc: vi.fn()
})

const { mockEmbeddings, MockOpenAI } = vi.hoisted(() => {
  const mockEmb = { create: vi.fn() }
  return {
    mockEmbeddings: mockEmb,
    MockOpenAI: vi.fn().mockImplementation(function() {
      return {
        embeddings: mockEmb,
      }
    }),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => createMockSupabaseClient())
}))

vi.mock('openai', () => ({
  __esModule: true,
  default: MockOpenAI,
  OpenAI: MockOpenAI
}))

describe('vector-retriever', () => {
  describe('retrieveContextFromVectorStore', () => {
    const mockEmbedding = Array(384).fill(0.5)

    beforeEach(async () => {
      vi.resetModules()
      vi.clearAllMocks()
      // Reset mock implementations after clearAllMocks
      mockEmbeddings.create.mockReset()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should combine vector and keyword scores correctly', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      // Mock vector search (match_profile_embeddings RPC)
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

      // Mock keyword search (profiles select with limit 100)
      const mockQueryBuilder = mockSupabaseClient.from('profiles')
      ;(mockQueryBuilder.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockQueryBuilder,
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-1', display_name: 'Alice', headline: 'React Developer', bio: '5 years experience', looking_for: ['mentorship'], skills: [{ skill_name: 'React' }], interests: [{ interest: 'AI' }] },
            { id: 'user-2', display_name: 'Bob', headline: 'Backend Engineer', bio: '3 years experience', looking_for: ['collaboration'], skills: [{ skill_name: 'Node' }], interests: [{ interest: 'Databases' }] }
          ],
          error: null
        })
      })

      const result = await retrieveContextFromVectorStore('React developer', 'current-user')

      expect(result.contexts.length).toBeGreaterThan(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle vector search failure and fallback to keyword only', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Database connection failed'))

      const mockQueryBuilder = mockSupabaseClient.from('profiles')
      ;(mockQueryBuilder.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockQueryBuilder,
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-2', display_name: 'Bob', headline: 'Backend Engineer', bio: 'Node.js developer', looking_for: ['collaboration'], skills: [{ skill_name: 'Node' }], interests: [{ interest: 'Databases' }] }
          ],
          error: null
        })
      })

      const result = await retrieveContextFromVectorStore('backend developer', 'current-user')

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Vector search failed')
    })

    it('should handle embedding generation failure gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockRejectedValue(
        new Error('OpenAI API error')
      )

      const result = await retrieveContextFromVectorStore('test query', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Failed to generate query embedding')
    })

    it('should return empty array when both searches fail', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Database error'))

      const mockQueryBuilder = mockSupabaseClient.from('profiles')
      ;(mockQueryBuilder.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockQueryBuilder,
        limit: vi.fn().mockRejectedValue(new Error('Keyword search error'))
      })

      const result = await retrieveContextFromVectorStore('test', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should use custom weights when provided', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockResolvedValue({
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

      const mockQueryBuilder = mockSupabaseClient.from('profiles')
      ;(mockQueryBuilder.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockQueryBuilder,
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-1', display_name: 'Alice', headline: 'Full Stack Developer', bio: null, looking_for: [], skills: [], interests: [] }
          ],
          error: null
        })
      })

      const result = await retrieveContextFromVectorStore('full stack', 'current-user', {
        vectorWeight: 0.9,
        keywordWeight: 0.1
      })

      expect(result.contexts.length).toBeGreaterThan(0)
    })

    it('should handle database query returning no results', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      const mockSupabaseClient = createMockSupabaseClient()
      ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
      mockEmbeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      })

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })

      const mockQueryBuilder = mockSupabaseClient.from('profiles')
      ;(mockQueryBuilder.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockQueryBuilder,
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      const result = await retrieveContextFromVectorStore('nonexistent query xyz', 'current-user')

      expect(result.contexts).toEqual([])
      expect(result.warnings.some(w => w.includes('No relevant context found'))).toBe(true)
    })
  })
})
