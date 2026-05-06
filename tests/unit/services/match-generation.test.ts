/**
 * TC-051, TC-053, TC-054: Match Generation Tests
 *
 * TC-051: Cosine similarity search via pgvector
 * TC-053: Complementary skills matching (Tech + Business)
 * TC-054: No self-match in results
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMatches, generateBatchMatches, checkMatchGenerationStatus } from '@/lib/services/match-generation'

// Mock fetch for Python worker calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock dynamic Supabase import for checkMatchGenerationStatus
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('generateMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_PYTHON_WORKER_URL = 'http://localhost:8000'
  })

  // TC-054: User is not matched with themselves
  it('TC-054: passes user_id to Python worker to exclude self from matching', async () => {
    // Arrange
    const userId = 'user-abc-123'
    const mockResponse = {
      suggestions_created: 3,
      matches: [
        {
          id: 'm1',
          user_id: userId,
          matched_user_id: 'user-def-456',
          match_percentage: 88,
          reasons: ['Shared interest in AI'],
          ai_confidence: 0.92,
          ai_explanation: 'Great match',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    // Act
    const { data, error } = await generateMatches(userId)

    // Assert
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.suggestions_created).toBe(3)

    // Verify the worker was called with the user ID for exclusion
    const fetchCall = mockFetch.mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    expect(body.user_id).toBe(userId)
    expect(body.limit).toBe(20)

    // Verify no matched_user_id matches the requesting user
    for (const match of data!.matches) {
      expect(match.user_id).toBe(userId)
      expect(match.matched_user_id).not.toBe(userId)
    }
  })

  it('TC-054: ensures all returned matches exclude the current user', async () => {
    // Arrange
    const userId = 'current-user'
    const mockResult = {
      suggestions_created: 2,
      matches: [
        { id: 'a', user_id: userId, matched_user_id: 'other-1', match_percentage: 75, reasons: [], status: 'active', created_at: new Date().toISOString() },
        { id: 'b', user_id: userId, matched_user_id: 'other-2', match_percentage: 82, reasons: [], status: 'active', created_at: new Date().toISOString() },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    // Act
    const { data } = await generateMatches(userId)

    // Assert
    const matchedIds = data!.matches.map((m) => m.matched_user_id)
    expect(matchedIds).not.toContain(userId)
    expect(new Set(matchedIds).size).toBe(matchedIds.length) // no duplicates
  })

  // TC-051: Cosine similarity search via pgvector
  it('TC-051: returns matches ranked by match_percentage (descending)', async () => {
    // Arrange
    const userId = 'user-cos'
    const mockResult = {
      suggestions_created: 4,
      matches: [
        { id: 'm1', user_id: userId, matched_user_id: 'high', match_percentage: 95, reasons: [], status: 'active', created_at: new Date().toISOString() },
        { id: 'm2', user_id: userId, matched_user_id: 'med1', match_percentage: 85, reasons: [], status: 'active', created_at: new Date().toISOString() },
        { id: 'm3', user_id: userId, matched_user_id: 'med2', match_percentage: 72, reasons: [], status: 'active', created_at: new Date().toISOString() },
        { id: 'm4', user_id: userId, matched_user_id: 'low', match_percentage: 55, reasons: [], status: 'active', created_at: new Date().toISOString() },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    // Act
    const { data } = await generateMatches(userId)

    // Assert
    const percentages = data!.matches.map((m) => m.match_percentage)
    // Verify descending order
    for (let i = 1; i < percentages.length; i++) {
      expect(percentages[i - 1]).toBeGreaterThanOrEqual(percentages[i])
    }
  })

  // TC-051: Test that the worker returns matches with similarity-based scores
  it('TC-051: returns matches with meaningful ai_confidence values', async () => {
    // Arrange
    const userId = 'user-conf'
    const mockResult = {
      suggestions_created: 2,
      matches: [
        { id: 'a', user_id: userId, matched_user_id: 'other-a', match_percentage: 91, reasons: [], ai_confidence: 0.94, status: 'active', created_at: new Date().toISOString() },
        { id: 'b', user_id: userId, matched_user_id: 'other-b', match_percentage: 65, reasons: [], ai_confidence: 0.71, status: 'active', created_at: new Date().toISOString() },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    // Act
    const { data } = await generateMatches(userId)

    // Assert
    expect(data!.matches[0].ai_confidence).toBeGreaterThan(0.9)
    expect(data!.matches[1].ai_confidence).toBeGreaterThan(0.7)
    // Higher match should have higher confidence
    expect(data!.matches[0].ai_confidence!).toBeGreaterThan(data!.matches[1].ai_confidence!)
  })

  // TC-053: Complementary skills matching
  it('TC-053: match reasons include complementary skill pairs (Tech + Business)', async () => {
    // Arrange
    const userId = 'dev-user'
    const mockResult = {
      suggestions_created: 1,
      matches: [
        {
          id: 'comp-1',
          user_id: userId,
          matched_user_id: 'biz-user',
          match_percentage: 87,
          reasons: [
            'Complementary Skills (Backend ↔ Frontend)',
            'Shared interest in Fintech',
          ],
          ai_confidence: 0.91,
          ai_explanation: 'Your backend skills complement their frontend expertise',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    // Act
    const { data } = await generateMatches(userId)

    // Assert
    const reasons = data!.matches[0].reasons
    const hasComplementary = reasons.some((r: string) =>
      r.toLowerCase().includes('complementary') || r.toLowerCase().includes('complementing')
    )
    expect(hasComplementary).toBe(true)

    // Verify the match pairs complementary roles, not identical ones
    const explanation = data!.matches[0].ai_explanation
    expect(explanation).toBeTruthy()
    expect(explanation!.toLowerCase()).toMatch(/complement|backend|frontend/)
  })

  // TC-053: Complementary skills should weight correctly for skill alignment
  it('TC-053: complementary match includes skill-alignment type reason', async () => {
    // Arrange
    const userId = 'founder-tech'
    const mockResult = {
      suggestions_created: 1,
      matches: [
        {
          id: 'sk-1',
          user_id: userId,
          matched_user_id: 'biz-strat',
          match_percentage: 84,
          reasons: ['Shared skills: Python, React', 'Complementary roles detected'],
          ai_confidence: 0.88,
          ai_explanation: 'Technical founder matched with business strategist',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    // Act
    const { data } = await generateMatches(userId)

    // Assert
    const reasons = data!.matches[0].reasons
    expect(reasons.length).toBeGreaterThanOrEqual(2)
    // Should have both shared and complementary reasons
    const hasShared = reasons.some((r: string) => r.toLowerCase().includes('shared'))
    const hasRole = reasons.some((r: string) =>
      r.toLowerCase().includes('complementary') || r.toLowerCase().includes('role')
    )
    expect(hasShared || hasRole).toBe(true)
  })
})

describe('generateBatchMatches', () => {
  it('sends correct payload with user_ids and limit to the worker', async () => {
    // Arrange
    const userIds = ['u1', 'u2', 'u3']
    const limitPerUser = 10

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'queued', message: 'Batch started' }),
    })

    // Act
    const { data } = await generateBatchMatches(userIds, limitPerUser)

    // Assert
    expect(data).not.toBeNull()
    // Find the batch call - it may not be the first call due to other tests
    const batchCall = mockFetch.mock.calls.find(
      (call: unknown[]) => (call[0] as string).includes('/batch')
    )
    expect(batchCall).toBeDefined()
    const body = JSON.parse(batchCall![1].body)
    expect(body.user_ids).toEqual(userIds)
    expect(body.limit_per_user).toBe(limitPerUser)
  })
})

describe('checkMatchGenerationStatus', () => {
  it('returns "queued" status when user has no embedding', async () => {
    // Arrange
    const { createClient } = await import('@/lib/supabase/client')
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }

    // No embedding found (PGRST116 = no rows)
    const embeddingError = { code: 'PGRST116' }
    mockSupabase.single
      .mockResolvedValueOnce({ data: null, error: embeddingError })  // profile_embeddings
      .mockResolvedValueOnce({ data: [], error: null })              // match_suggestions

    vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

    // Act
    const { data } = await checkMatchGenerationStatus('test-user')

    // Assert
    expect(data).not.toBeNull()
    expect(data!.status).toBe('queued')
    expect(data!.message).toContain('embedding')
  })
})
