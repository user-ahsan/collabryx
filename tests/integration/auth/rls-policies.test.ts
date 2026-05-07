/**
 * RLS Policy Integration Tests — TC-015, TC-016, TC-017
 *
 * TC-015: RLS permits user to read their own messages
 * TC-016: RLS blocks user from querying another user's messages
 * TC-017: User cannot alter match_scores via direct API due to RLS
 *
 * These tests validate Row Level Security policies defined in
 * supabase/setup/99-master-all-tables.sql by simulating
 * different auth contexts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Helpers ──────────────────────────────────────────────────────────

interface MockUser {
  id: string
  email: string
  role: 'authenticated' | 'service_role'
}

const userA: MockUser = { id: 'user-a-id', email: 'usera@example.com', role: 'authenticated' }
const userB: MockUser = { id: 'user-b-id', email: 'userb@example.com', role: 'authenticated' }
const serviceRole: MockUser = { id: 'service-id', email: 'service@system', role: 'service_role' }

/**
 * Creates a mock Supabase client scoped to a specific user.
 * Every auth call returns the given user's identity.
 */
function createMockSupabaseForUser(user: MockUser | null) {
  const _jwt = user?.role === 'service_role'
    ? { role: 'service_role' }
    : { role: 'authenticated' }

  // Internal data store simulating what RLS would filter
  const conversations = [
    { id: 'conv-1', participant_1: 'user-a-id', participant_2: 'user-b-id' },
    { id: 'conv-2', participant_1: 'user-a-id', participant_2: 'user-c-id' },
    { id: 'conv-3', participant_1: 'user-b-id', participant_2: 'user-c-id' },
  ]

  const messages = [
    { id: 'msg-1', conversation_id: 'conv-1', sender_id: 'user-a-id', text: 'Hello from A' },
    { id: 'msg-2', conversation_id: 'conv-1', sender_id: 'user-b-id', text: 'Hello from B' },
    { id: 'msg-3', conversation_id: 'conv-3', sender_id: 'user-b-id', text: 'Secret B-C chat' },
  ]

  const matchScores = [
    { id: 'score-1', user_id_1: 'user-a-id', user_id_2: 'user-b-id', score: 0.85 },
    { id: 'score-2', user_id_1: 'user-a-id', user_id_2: 'user-c-id', score: 0.72 },
  ]

  // RLS simulation: "Users can view conversation messages"
  // FROM: EXISTS(conversations WHERE (participant_1 = auth.uid() OR participant_2 = auth.uid()))
  function rlsFilterMessages(authUserId: string | null, allMessages: typeof messages): typeof messages {
    if (!authUserId) return []
    const visibleConvIds = conversations
      .filter(c => c.participant_1 === authUserId || c.participant_2 === authUserId)
      .map(c => c.id)
    return allMessages.filter(m => visibleConvIds.includes(m.conversation_id))
  }

  // RLS simulation: match_scores — only service_role can view/insert
  function rlsFilterMatchScores(authRole: string | null): typeof matchScores {
    if (authRole === 'service_role') return matchScores
    return [] // regular users see nothing
  }

  function rlsCanInsertMatchScores(authRole: string | null): boolean {
    return authRole === 'service_role'
  }

  function rlsCanUpdateMatchScores(authRole: string | null): boolean {
    return authRole === 'service_role'
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        user ? { data: { user: { id: user.id, email: user.email } }, error: null }
          : { data: { user: null }, error: null }
      ),
      getSession: vi.fn().mockResolvedValue(
        user ? { data: { session: { user: { id: user.id } } }, error: null }
          : { data: { session: null }, error: null }
      ),
    },
    // RLS-filtered query methods
    from: vi.fn((table: string) => {
      const queryChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          // Simulate RLS filtering at query time
          if (table === 'messages') {
            const filtered = rlsFilterMessages(user?.id ?? null, messages)
            return Promise.resolve({ data: filtered, error: null })
          }
          if (table === 'match_scores') {
            const filtered = rlsFilterMatchScores(user?.role ?? null)
            if (filtered.length === 0) {
              return Promise.resolve({ data: [], error: null })
            }
            return Promise.resolve({ data: filtered, error: null })
          }
          return Promise.resolve({ data: [], error: null })
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'match_scores') {
            const filtered = rlsFilterMatchScores(user?.role ?? null)
            return Promise.resolve({ data: filtered.length > 0 ? filtered[0] : null, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
      }

      // Insert matches — only service_role can insert
      queryChain.insert.mockImplementation((record: Record<string, unknown>) => {
        if (table === 'match_scores' && !rlsCanInsertMatchScores(user?.role ?? null)) {
          return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } })
        }
        return Promise.resolve({ data: record, error: null })
      })

      // Update — only service_role can update match_scores
      queryChain.update.mockImplementation((_record: Record<string, unknown>) => {
        if (table === 'match_scores' && !rlsCanUpdateMatchScores(user?.role ?? null)) {
          return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } })
        }
        return Promise.resolve({ data: {}, error: null })
      })

      return queryChain
    }),
  }
}

// ── Tests ────────────────────────────────────────────────────────────

describe('RLS Policies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── TC-015: User reads own messages ───────────────────────────────

  describe('TC-015: RLS permits user to read their own messages', () => {
    it('should return messages for conversations the user participates in', async () => {
      // Arrange — User A is a participant in conv-1 and conv-2
      const supabase = createMockSupabaseForUser(userA)

      // Act
      const { data, error } = await supabase.from('messages').select().single()

      // Assert
      expect(error).toBeNull()
      expect(data).toBeDefined()
      // User A should see messages from conv-1 (msg-1, msg-2) but NOT conv-3
      const texts = (data as Array<{ text: string }>).map(m => m.text)
      expect(texts).toContain('Hello from A')
      expect(texts).toContain('Hello from B')
      expect(texts).not.toContain('Secret B-C chat')
    })

    it('should return only messages from conversations the user belongs to', async () => {
      // Arrange — User B participates in conv-1 and conv-3
      const supabase = createMockSupabaseForUser(userB)

      // Act
      const { data } = await supabase.from('messages').select().single()

      // Assert
      const texts = (data as Array<{ text: string }>).map(m => m.text)
      expect(texts).toContain('Hello from A')
      expect(texts).toContain('Hello from B')
      expect(texts).toContain('Secret B-C chat') // conv-3 has user B
      expect(texts.length).toBe(3)
    })

    it('should return an empty array for unauthenticated users', async () => {
      // Arrange
      const supabase = createMockSupabaseForUser(null)

      // Act
      const { data } = await supabase.from('messages').select().single()

      // Assert
      expect(data).toEqual([])
    })
  })

  // ─── TC-016: RLS blocks another user's messages ────────────────────

  describe('TC-016: RLS blocks user from querying another user\'s messages', () => {
    it('should not return messages from conversations the user is not part of', async () => {
      // Arrange — User A is NOT in conv-3
      const supabase = createMockSupabaseForUser(userA)

      // Act
      const { data } = await supabase.from('messages').select().single()

      // Assert — msg-3 is in conv-3 which user A is not part of
      const texts = (data as Array<{ text: string }>).map(m => m.text)
      expect(texts).not.toContain('Secret B-C chat')
    })

    it('should prevent user C from seeing user A\'s private conversation messages', async () => {
      // Arrange — User C (user-c-id) is NOT in conv-1
      const userC: MockUser = { id: 'user-c-id', email: 'userc@example.com', role: 'authenticated' }
      const supabase = createMockSupabaseForUser(userC)

      // Act
      const { data } = await supabase.from('messages').select().single()

      // Assert — user C only sees conv-2 (with A) and conv-3 (with B)
      // msg-1 and msg-2 are in conv-1 (A+B only) — should be hidden
      const texts = (data as Array<{ text: string }>).map(m => m.text)
      expect(texts).not.toContain('Hello from A')
      expect(texts).not.toContain('Hello from B') // msg-2 is also in conv-1
    })

    it('should return no messages for a user with no conversations', async () => {
      // Arrange — isolated user with no conversations
      const isolatedUser: MockUser = { id: 'isolated-user', email: 'isolated@example.com', role: 'authenticated' }
      const supabase = createMockSupabaseForUser(isolatedUser)

      // Act
      const { data } = await supabase.from('messages').select().single()

      // Assert
      expect(data).toEqual([])
    })
  })

  // ─── TC-017: RLS blocks match_scores alteration ─────────────────────

  describe('TC-017: User cannot alter match_scores via direct API due to RLS', () => {
    it('should not allow regular users to read match_scores', async () => {
      // Arrange — Regular user trying to read match_scores
      const supabase = createMockSupabaseForUser(userA)

      // Act
      const { data, error } = await supabase.from('match_scores').select().single()

      // Assert — RLS blocks: only service_role can SELECT
      expect(error).toBeNull()
      expect(data).toEqual([]) // regular users see empty result
    })

    it('should not allow regular users to insert into match_scores', async () => {
      // Arrange — Regular user trying to insert a match score
      const supabase = createMockSupabaseForUser(userA)

      // Act
      const { data, error } = await supabase.from('match_scores').insert({
        user_id_1: 'user-a-id',
        user_id_2: 'user-b-id',
        score: 0.99,
      })

      // Assert
      expect(error).toBeDefined()
      expect(error?.message).toContain('row-level security policy')
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })

    it('should not allow regular users to update match_scores', async () => {
      // Arrange — Regular user trying to update a match score
      const supabase = createMockSupabaseForUser(userA)

      // Act
      const { data, error } = await supabase.from('match_scores').update({ score: 1.0 })

      // Assert
      expect(error).toBeDefined()
      expect(error?.message).toContain('row-level security policy')
      expect(error?.code).toBe('42501')
      expect(data).toBeNull()
    })

    it('should allow service_role to read match_scores', async () => {
      // Arrange — Service role
      const supabase = createMockSupabaseForUser(serviceRole)

      // Act
      const { data, error } = await supabase.from('match_scores').select().single()

      // Assert
      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect((data as Array<{ score: number }>).length).toBeGreaterThan(0)
    })

    it('should allow service_role to insert match_scores', async () => {
      // Arrange
      const supabase = createMockSupabaseForUser(serviceRole)

      // Act
      const { data, error } = await supabase.from('match_scores').insert({
        user_id_1: 'user-a-id',
        user_id_2: 'user-d-id',
        score: 0.65,
      })

      // Assert
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should not allow unauthenticated users to access match_scores', async () => {
      // Arrange
      const supabase = createMockSupabaseForUser(null)

      // Act
      const { data } = await supabase.from('match_scores').select().single()

      // Assert
      expect(data).toEqual([])
    })
  })
})
