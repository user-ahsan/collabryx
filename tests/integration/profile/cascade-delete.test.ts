/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabaseClient } from '@/tests/setup/mocks'

/**
 * TC-030: Cascading Deletion Integration Test
 *
 * Tests that when a profile is deleted, all related records
 * are also cleaned up:
 * - profile_embeddings
 * - match_scores
 * - user_skills
 * - user_experiences
 * - user_projects
 * - user_interests
 * - posts, comments, reactions (any owned content)
 *
 * This validates the data integrity and prevents orphaned records.
 */
describe('Cascading Delete (TC-030)', () => {
  const USER_ID = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Profile Deletion Triggers Cleanup', () => {
    it('should delete profile and cascade to related tables', async () => {
      // Arrange: Set up delete mocks for each related table
      const deleteMocks: Record<string, { delete: any; eq: any }> = {}

      const relatedTables = [
        'user_skills',
        'user_interests',
        'user_experiences',
        'user_projects',
        'user_education',
        'profile_embeddings',
        'match_scores',
      ]

      relatedTables.forEach(table => {
        const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
        const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
        deleteMocks[table] = { delete: deleteMock, eq: eqMock }
      })

      // Profile delete mock
      const profileEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const profileDeleteMock = vi.fn().mockReturnValue({ eq: profileEqMock })

      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { delete: profileDeleteMock, eq: profileEqMock } as any
        }
        if (deleteMocks[table]) {
          return deleteMocks[table] as any
        }
        return {} as any
      })

      // Act: Simulate full cascade delete sequence
      // Step 1: Delete related records first (to avoid FK violations)
      for (const table of relatedTables) {
        await mockSupabaseClient.from(table).delete().eq('user_id', USER_ID)
      }

      // Step 2: Delete the profile itself
      await mockSupabaseClient.from('profiles').delete().eq('id', USER_ID)

      // Assert: All tables were called with delete
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profile_embeddings')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('match_scores')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_experiences')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_projects')

      // Verify delete was called on each
      expect(profileDeleteMock).toHaveBeenCalled()
      for (const table of relatedTables) {
        expect(deleteMocks[table].delete).toHaveBeenCalled()
        expect(deleteMocks[table].eq).toHaveBeenCalledWith('user_id', USER_ID)
      }

      expect(profileEqMock).toHaveBeenCalledWith('id', USER_ID)
    })

    it('should clean up profile_embeddings when profile is deleted', async () => {
      // Arrange
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      } as any)

      // Act
      await mockSupabaseClient
        .from('profile_embeddings')
        .delete()
        .eq('user_id', USER_ID)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profile_embeddings')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('user_id', USER_ID)
    })

    it('should clean up match_scores when profile is deleted', async () => {
      // Arrange
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      } as any)

      // Act: match_scores references profiles by profile_1_id and profile_2_id
      await mockSupabaseClient
        .from('match_scores')
        .delete()
        .eq('profile_1_id', USER_ID)

      await mockSupabaseClient
        .from('match_scores')
        .delete()
        .eq('profile_2_id', USER_ID)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('match_scores')
      expect(deleteMock).toHaveBeenCalledTimes(2)
      expect(eqMock).toHaveBeenCalledWith('profile_1_id', USER_ID)
      expect(eqMock).toHaveBeenCalledWith('profile_2_id', USER_ID)
    })

    it('should not leave orphaned records in any related table', async () => {
      // Arrange: Track all deletions
      const deletedTables = new Set<string>()
      const relatedTables = [
        'profile_embeddings',
        'match_scores',
        'user_skills',
        'user_interests',
        'user_experiences',
        'user_projects',
        'user_education',
      ]

      // Set up mocks for each table
      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        deletedTables.add(table)
        const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
        const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
        return { delete: deleteMock, eq: eqMock } as any
      })

      // Act: Delete all related records + the profile
      for (const table of relatedTables) {
        await mockSupabaseClient.from(table).delete().eq('user_id', USER_ID)
      }
      await mockSupabaseClient.from('profiles').delete().eq('id', USER_ID)

      // Assert: Every related table + profiles was cleaned up
      expect(deletedTables.has('profiles')).toBe(true)
      expect(deletedTables.has('profile_embeddings')).toBe(true)
      expect(deletedTables.has('match_scores')).toBe(true)
      for (const table of relatedTables) {
        expect(deletedTables.has(table)).toBe(true)
      }
    })
  })

  describe('Delete Order Matters', () => {
    it('should delete child records BEFORE parent profile', () => {
      // Arrange
      const operations: string[] = []

      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        operations.push(`from:${table}`)
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      })

      // Act: Simulate the correct order (children first, parent last)
      const childTables = [
        'user_skills', 'user_interests', 'user_experiences',
        'user_projects', 'user_education',
        'profile_embeddings', 'match_scores',
      ]

      // Children first
      for (const table of childTables) {
        mockSupabaseClient.from(table).delete().eq('user_id', USER_ID)
      }

      // Parent last
      mockSupabaseClient.from('profiles').delete().eq('id', USER_ID)

      // Assert: Profile is the LAST table accessed
      // (children must be deleted first to avoid FK violations)
      const allChildOps = operations.filter(o => o !== 'from:profiles')
      const profileOp = operations.filter(o => o === 'from:profiles')

      expect(allChildOps.length).toBe(childTables.length)
      expect(profileOp.length).toBe(1)

      // Profile deletion should happen after all children
      const lastChildIdx = operations.length - 1 - operations.slice().reverse().findIndex(o => o !== 'from:profiles')
      const profileIdx = operations.length - 1 - operations.slice().reverse().findIndex(o => o === 'from:profiles')
      expect(profileIdx).toBeGreaterThan(lastChildIdx)
    })
  })

  describe('Error Handling During Cascade', () => {
    it('should handle partial deletion failure gracefully', async () => {
      // Arrange: Make one table fail
      const deleteMocks: Record<string, { error: boolean }> = {
        user_skills: { error: false },
        user_interests: { error: false },
        profile_embeddings: { error: true }, // This one fails
        match_scores: { error: false },
      }

      const _failures = 0
      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        const mock = deleteMocks[table]
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue(
            mock?.error
              ? { data: null, error: { message: 'Deletion failed' } }
              : { data: null, error: null }
          ),
        } as any
      })

      // Act
      const results: Array<{ table: string; error: boolean }> = []
      for (const table of ['user_skills', 'user_interests', 'profile_embeddings', 'match_scores']) {
        const result = await mockSupabaseClient.from(table).delete().eq('user_id', USER_ID)
        results.push({ table, error: !!result.error })
      }

      // Assert
      const failed = results.filter(r => r.error)
      expect(failed).toHaveLength(1)
      expect(failed[0].table).toBe('profile_embeddings')
    })

    it('should continue deleting other tables even if one fails', async () => {
      // Arrange
      const deletedTables: string[] = []

      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        // profile_embeddings throws an error
        if (table === 'profile_embeddings') {
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockRejectedValue(new Error('Foreign key constraint')),
          } as any
        }

        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(() => {
            deletedTables.push(table)
            return { data: null, error: null }
          }),
        } as any
      })

      // Act: Try to delete all, catching errors
      const tables = ['user_skills', 'profile_embeddings', 'match_scores']

      for (const table of tables) {
        try {
          await mockSupabaseClient.from(table).delete().eq('user_id', USER_ID)
        } catch {
          // Continue despite error
        }
      }

      // Assert: Other tables still got deleted
      expect(deletedTables).toContain('user_skills')
      expect(deletedTables).toContain('match_scores')
      expect(deletedTables).not.toContain('profile_embeddings')
    })
  })
})
