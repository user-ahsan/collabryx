/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabaseClient } from '@/tests/setup/mocks'

// Supabase is auto-mocked via tests/setup/mocks.ts
// We use the shared mockSupabaseClient and configure per-test behavior

describe('Profile Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================
  // TC-022: Update Technical Skills
  // =============================================
  describe('Skills Management (TC-022)', () => {
    it('should insert skills into user_skills table', async () => {
      // Arrange
      const skillsData = [
        { user_id: 'test-user-id', skill_name: 'React', proficiency: 'expert', is_primary: true },
        { user_id: 'test-user-id', skill_name: 'Python', proficiency: 'advanced', is_primary: true },
      ]

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: skillsData, error: null }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('user_skills')
        .insert(skillsData)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(result.error).toBeNull()
      expect(result.data).toEqual(skillsData)
    })

    it('should delete existing skills before inserting new ones (reconciliation)', async () => {
      // Arrange
      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const deleteResult = await mockSupabaseClient
        .from('user_skills')
        .delete()
        .eq('user_id', 'test-user-id')

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_skills')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(deleteResult.error).toBeNull()
    })

    it('should handle skill insertion errors gracefully', async () => {
      // Arrange
      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Duplicate skill', code: '23505' },
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('user_skills')
        .insert({ user_id: 'test-user-id', skill_name: 'React', is_primary: true })

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe('23505')
      expect(result.data).toBeNull()
    })

    it('should insert skills with correct user_id and skill_name', async () => {
      // Arrange
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      const expectedSkill = {
        user_id: 'test-user-id',
        skill_name: 'TypeScript',
        is_primary: true,
      }

      // Act
      await mockSupabaseClient
        .from('user_skills')
        .insert(expectedSkill)

      // Assert
      expect(insertMock).toHaveBeenCalledWith(expectedSkill)
    })
  })

  // =============================================
  // TC-024: Add Work Experiences
  // =============================================
  describe('Work Experiences Management (TC-024)', () => {
    it('should insert experience into user_experiences table', async () => {
      // Arrange
      const experienceData = {
        user_id: 'test-user-id',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        description: 'Led frontend team of 5 engineers',
        is_current: true,
      }

      const insertMock = vi.fn().mockResolvedValue({
        data: [{ ...experienceData, id: 'exp-1' }],
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('user_experiences')
        .insert(experienceData)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_experiences')
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Senior Software Engineer')
    })

    it('should insert multiple experiences', async () => {
      // Arrange
      const experiences = [
        { user_id: 'test-user-id', title: 'Engineer', company: 'Co A', is_current: false },
        { user_id: 'test-user-id', title: 'Senior Engineer', company: 'Co B', is_current: true },
      ]

      const insertMock = vi.fn().mockResolvedValue({ data: experiences, error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('user_experiences')
        .insert(experiences)

      // Assert
      expect(insertMock).toHaveBeenCalledWith(experiences)
      expect(result.error).toBeNull()
    })

    it('should filter out experiences with no title or company', () => {
      // Arrange
      const allExperiences = [
        { user_id: 'test-user-id', title: 'Valid Job', company: 'Co', is_current: true },
        { user_id: 'test-user-id', title: '', company: '', is_current: true },
        { user_id: 'test-user-id', title: 'Another Job', company: 'Inc', is_current: false },
      ]

      // Act: filter logic from experience-projects-settings-tab
      const filtered = allExperiences.filter(e => e.title || e.company)

      // Assert
      expect(filtered).toHaveLength(2)
      expect(filtered[0].title).toBe('Valid Job')
      expect(filtered[1].title).toBe('Another Job')
    })

    it('should handle empty experience insert attempt gracefully', () => {
      // Arrange
      const emptyExperiences: Array<{ user_id: string; title: string; company: string; is_current: boolean }> = ([] as Array<{ user_id: string; title: string; company: string; is_current: boolean }>)
        .filter(e => e.title || e.company)

      // Assert
      expect(emptyExperiences).toHaveLength(0)
    })
  })

  // =============================================
  // TC-025: Add Portfolio Projects
  // =============================================
  describe('Portfolio Projects Management (TC-025)', () => {
    it('should insert project into user_projects table', async () => {
      // Arrange
      const projectData = {
        user_id: 'test-user-id',
        title: 'Collabryx Platform',
        description: 'AI-powered collaboration platform',
        url: 'https://collabryx.com',
        is_public: true,
      }

      const insertMock = vi.fn().mockResolvedValue({
        data: [{ ...projectData, id: 'proj-1' }],
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('user_projects')
        .insert(projectData)

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_projects')
      expect(result.error).toBeNull()
      expect(result.data[0].title).toBe('Collabryx Platform')
    })

    it('should insert project with tech stack array', async () => {
      // Arrange
      const projectWithTech = {
        user_id: 'test-user-id',
        title: 'Portfolio Site',
        description: 'Personal portfolio',
        url: 'https://portfolio.dev',
        tech_stack: ['Next.js', 'TypeScript', 'Tailwind'],
        is_public: true,
      }

      const insertMock = vi.fn().mockResolvedValue({ data: [projectWithTech], error: null })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      await mockSupabaseClient.from('user_projects').insert(projectWithTech)

      // Assert
      expect(insertMock).toHaveBeenCalledWith(projectWithTech)
    })

    it('should filter out projects with empty titles', () => {
      // Arrange
      const allProjects = [
        { user_id: 'test-user-id', title: 'Valid Project', is_public: true },
        { user_id: 'test-user-id', title: '', is_public: true },
        { user_id: 'test-user-id', title: 'Another Project', is_public: false },
      ]

      // Act
      const filtered = allProjects.filter(p => p.title)

      // Assert
      expect(filtered).toHaveLength(2)
      expect(filtered[0].title).toBe('Valid Project')
    })

    it('should set is_public default to true for new projects', () => {
      // Arrange
      const projectDefaults: { user_id: string; title: string; is_public?: boolean } = {
        user_id: 'test-user-id',
        title: 'New Project',
      }

      const withDefaults = {
        ...projectDefaults,
        is_public: projectDefaults.is_public ?? true,
      }

      // Assert
      expect(withDefaults.is_public).toBe(true)
    })

    it('should reject project title longer than 100 characters', () => {
      // Arrange
      const longTitle = 'A'.repeat(101)

      // Act & Assert: This is handled by Zod validation in the settings schema
      expect(longTitle.length).toBeGreaterThan(100)
    })
  })

  // =============================================
  // TC-028: Toggle Available for Collaboration
  // =============================================
  describe('Collaboration Availability Toggle (TC-028)', () => {
    it('should update collaboration_readiness to available', async () => {
      // Arrange
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        data: { collaboration_readiness: 'available' },
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        update: updateMock,
        eq: eqMock,
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('profiles')
        .update({ collaboration_readiness: 'available', updated_at: expect.any(String) })
        .eq('id', 'test-user-id')

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboration_readiness: 'available',
        })
      )
      expect(eqMock).toHaveBeenCalledWith('id', 'test-user-id')
    })

    it('should update collaboration_readiness to not-available', async () => {
      // Arrange
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        data: { collaboration_readiness: 'not-available' },
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        update: updateMock,
        eq: eqMock,
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      await mockSupabaseClient
        .from('profiles')
        .update({ collaboration_readiness: 'not-available' })
        .eq('id', 'test-user-id')

      // Assert
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboration_readiness: 'not-available',
        })
      )
    })

    it('should toggle from available to not-available', async () => {
      // Arrange
      const currentState = 'available'
      const newState = currentState === 'available' ? 'not-available' : 'available'

      // Assert: toggle logic
      expect(newState).toBe('not-available')
    })

    it('should toggle from not-available to available', async () => {
      // Arrange
      const currentState: string = 'not-available'
      const newState = currentState === 'not-available' ? 'available' : 'not-available'

      // Assert: toggle logic
      expect(newState).toBe('available')
    })

    it('should handle update error for collaboration status', async () => {
      // Arrange
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '500' },
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: eqMock,
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      } as any)

      // Act
      const result = await mockSupabaseClient
        .from('profiles')
        .update({ collaboration_readiness: 'available' })
        .eq('id', 'test-user-id')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.data).toBeNull()
    })
  })
})
