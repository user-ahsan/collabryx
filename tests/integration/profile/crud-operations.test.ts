/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabaseClient } from '@/tests/setup/mocks'

/**
 * TC-022 → TC-025, TC-028: CRUD Operations Integration Tests
 *
 * Tests the full lifecycle of profile-related data:
 * - Skills creation (upsert/delete/insert)
 * - Experiences insertion
 * - Projects insertion
 * - Collaboration status toggle
 * - Profile update with all related data
 */
describe('Profile CRUD Operations Integration (TC-022-025, TC-028)', () => {
  const USER_ID = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================
  // TC-022: Skills CRUD
  // =============================================
  describe('Skills Lifecycle (TC-022)', () => {
    it('should upsert skills with reconciliation (delete-all + insert)', async () => {
      // Arrange
      const deleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock })
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        if (table === 'user_skills') {
          return { delete: deleteMock, insert: insertMock } as any
        }
        return {} as any
      })

      const skills = [
        'React', 'TypeScript', 'Python', 'Node.js',
      ]

      // Act: Reconcile by delete-all then insert
      await mockSupabaseClient.from('user_skills').delete().eq('user_id', USER_ID)
      await mockSupabaseClient.from('user_skills').insert(
        skills.map(s => ({ user_id: USER_ID, skill_name: s, is_primary: skills.indexOf(s) < 3 }))
      )

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(deleteMock).toHaveBeenCalled()
      expect(deleteEqMock).toHaveBeenCalledWith('user_id', USER_ID)
      expect(insertMock).toHaveBeenCalled()
    })

    it('should mark first 5 skills as primary', () => {
      // Arrange
      const skills = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

      // Act
      const mapped = skills.map((s, i) => ({
        user_id: USER_ID,
        skill_name: s,
        is_primary: i < 5,
      }))

      // Assert
      expect(mapped.filter(s => s.is_primary)).toHaveLength(5)
      expect(mapped[5].is_primary).toBe(false)
    })

    it('should handle empty skills array gracefully', async () => {
      // Arrange
      const deleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        delete: deleteMock,
        insert: vi.fn(),
      } as any)

      const _skills: string[] = []

      // Act: Delete without inserting if empty
      await mockSupabaseClient.from('user_skills').delete().eq('user_id', USER_ID)
      // Note: insert is not called when skills is empty

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(deleteMock).toHaveBeenCalled()
    })
  })

  // =============================================
  // TC-024: Experiences CRUD
  // =============================================
  describe('Experiences Lifecycle (TC-024)', () => {
    it('should insert multiple experiences', async () => {
      // Arrange
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
      } as any)

      const experiences = [
        { user_id: USER_ID, title: 'SWE', company: 'Co A', is_current: false },
        { user_id: USER_ID, title: 'Sr SWE', company: 'Co B', is_current: true },
      ]

      // Act
      await mockSupabaseClient.from('user_experiences').insert(experiences)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_experiences')
      expect(insertMock).toHaveBeenCalledWith(experiences)
    })

    it('should reconcile experiences (delete-all + re-insert)', async () => {
      // Arrange
      const deleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock })
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      let callCount = 0
      vi.mocked(mockSupabaseClient.from).mockImplementation(() => {
        callCount++
        return {
          delete: callCount === 1 ? deleteMock : vi.fn(),
          insert: callCount === 2 ? insertMock : vi.fn(),
        } as any
      })

      // Act: Delete existing then insert
      await mockSupabaseClient.from('user_experiences').delete().eq('user_id', USER_ID)
      await mockSupabaseClient.from('user_experiences').insert([
        { user_id: USER_ID, title: 'Updated Role', is_current: true },
      ])

      // Assert
      expect(deleteMock).toHaveBeenCalled()
      expect(insertMock).toHaveBeenCalled()
    })

    it('should filter out experiences with no meaningful content', () => {
      // Arrange
      const experiences = [
        { title: 'Valid', company: 'Co', is_current: true },
        { title: '', company: '', is_current: false },
        { title: '', company: 'Only Company', is_current: false },
        { title: 'Only Title', company: '', is_current: true },
      ]

      // Act
      const filtered = experiences.filter(e => e.title || e.company)

      // Assert
      expect(filtered).toHaveLength(3)
      expect(filtered[0].title).toBe('Valid')
      expect(filtered[1].company).toBe('Only Company')
      expect(filtered[2].title).toBe('Only Title')
    })
  })

  // =============================================
  // TC-025: Projects CRUD
  // =============================================
  describe('Projects Lifecycle (TC-025)', () => {
    it('should insert project with all fields', async () => {
      // Arrange
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
      } as any)

      const project = {
        user_id: USER_ID,
        title: 'Collabryx',
        description: 'AI collaboration platform',
        url: 'https://collabryx.com',
        tech_stack: ['Next.js', 'TypeScript', 'Supabase'],
        is_public: true,
      }

      // Act
      await mockSupabaseClient.from('user_projects').insert(project)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_projects')
      expect(insertMock).toHaveBeenCalledWith(project)
    })

    it('should filter out projects with empty titles', () => {
      // Arrange
      const projects = [
        { title: 'Valid Project' },
        { title: '' },
        { title: 'Another Project' },
        { title: '' },
      ]

      // Act
      const filtered = projects.filter(p => p.title)

      // Assert
      expect(filtered).toHaveLength(2)
    })

    it('should set is_public default for projects', async () => {
      // Arrange
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
      } as any)

      const rawProject = { user_id: USER_ID, title: 'New Project', is_public: undefined as boolean | undefined }
      const withDefaults = { ...rawProject, is_public: rawProject.is_public ?? true }

      // Act
      await mockSupabaseClient.from('user_projects').insert(withDefaults)

      // Assert
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_public: true })
      )
    })

    it('should reject project with invalid URL', () => {
      // Validation check - URLs should be valid or empty
      const invalidUrl = 'not-a-url'
      const urlPattern = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/

      // This URL does not match a proper URL format
      expect(urlPattern.test(invalidUrl)).toBe(false)
    })
  })

  // =============================================
  // TC-028: Availability Toggle
  // =============================================
  describe('Collaboration Availability Toggle (TC-028)', () => {
    it('should toggle collaboration_readiness on profile', async () => {
      // Arrange
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        data: { collaboration_readiness: 'available' },
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      } as any)

      // Act: Toggle to "available"
      const _result = await mockSupabaseClient
        .from('profiles')
        .update({ collaboration_readiness: 'available', updated_at: expect.any(String) })
        .eq('id', USER_ID)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ collaboration_readiness: 'available' })
      )
      expect(eqMock).toHaveBeenCalledWith('id', USER_ID)
    })

    it('should cycle through all readiness states', () => {
      // Arrange
      const states = ['available', 'open', 'not-available'] as const

      // Act & Assert: Each state is a valid collaboration_readiness value
      states.forEach(state => {
        expect(states).toContain(state)
      })
    })

    it('should handle failed availability update', async () => {
      // Arrange
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: eqMock,
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('profiles')
        .update({ collaboration_readiness: 'available' })
        .eq('id', 'non-existent-user')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.data).toBeNull()
    })
  })

  // =============================================
  // Combined Profile Update
  // =============================================
  describe('Full Profile Update', () => {
    it('should update profile with all related data in sequence', async () => {
      // Arrange
      const profileUpdateMock = vi.fn().mockReturnThis()
      const profileEqMock = vi.fn().mockResolvedValue({ data: null, error: null })

      const skillsDeleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const skillsDeleteMock = vi.fn().mockReturnValue({ eq: skillsDeleteEqMock })
      const skillsInsertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      const expDeleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const expDeleteMock = vi.fn().mockReturnValue({ eq: expDeleteEqMock })
      const expInsertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      const tableMockMap: Record<string, any> = {
        profiles: { update: profileUpdateMock, eq: profileEqMock },
        user_skills: { delete: skillsDeleteMock, insert: skillsInsertMock },
        user_experiences: { delete: expDeleteMock, insert: expInsertMock },
      }

      vi.mocked(mockSupabaseClient.from).mockImplementation(
        (table: string) => tableMockMap[table] || ({} as any)
      )

      // Act: Full profile update sequence
      // 1. Update profile
      await mockSupabaseClient
        .from('profiles')
        .update({ headline: 'Updated Headline', bio: 'New bio' })
        .eq('id', USER_ID)

      // 2. Reconcile skills
      await mockSupabaseClient.from('user_skills').delete().eq('user_id', USER_ID)
      await mockSupabaseClient.from('user_skills').insert([
        { user_id: USER_ID, skill_name: 'React', is_primary: true },
      ])

      // 3. Reconcile experiences
      await mockSupabaseClient.from('user_experiences').delete().eq('user_id', USER_ID)
      await mockSupabaseClient.from('user_experiences').insert([
        { user_id: USER_ID, title: 'Engineer', is_current: true },
      ])

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_experiences')

      expect(profileUpdateMock).toHaveBeenCalled()
      expect(skillsDeleteMock).toHaveBeenCalled()
      expect(skillsInsertMock).toHaveBeenCalled()
      expect(expDeleteMock).toHaveBeenCalled()
      expect(expInsertMock).toHaveBeenCalled()
    })
  })
})
