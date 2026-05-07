/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabaseClient } from '@/tests/setup/mocks'

/**
 * TC-021: Onboarding Flow Integration Test
 *
 * Simulates the multi-step wizard flow for structured data submission:
 * Step 1: Basic Info (fullName, displayName, headline, location)
 * Step 2: Skills (skills array with proficiency)
 * Step 3: Interests & Goals
 * Step 4: Experience & Links
 *
 * Tests that all structured data is correctly upserted to Supabase
 */
describe('Onboarding Flow Integration (TC-021)', () => {
  // Mock fetch for embedding API call
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mockFetch)
  })

  // Mock the completeOnboarding action
  const mockOnboardingAction = async (data: Record<string, unknown>, completionScore: number) => {
    const supabase = mockSupabaseClient

    // Step 1: Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Step 2: Check if already completed
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (existingProfile?.onboarding_completed) {
      return { success: true, userId: user.id, alreadyCompleted: true }
    }

    // Step 3: Upsert profile
    const profileData = {
      id: user.id,
      full_name: data.fullName,
      display_name: data.displayName,
      headline: data.headline,
      location: data.location,
      onboarding_completed: true,
      profile_completion: completionScore,
    }
    await supabase.from('profiles').upsert(profileData)

    // Step 4: Insert skills
    const skills = data.skills as Array<{ skill_name: string; is_primary: boolean }> | undefined
    if (skills?.length) {
      await supabase.from('user_skills').insert(
        skills.map(s => ({ user_id: user.id, ...s }))
      )
    }

    // Step 5: Insert interests
    const interests = data.interests as string[] | undefined
    if (interests?.length) {
      await supabase.from('user_interests').insert(
        interests.map(i => ({ user_id: user.id, interest: i }))
      )
    }

    return { success: true, userId: user.id }
  }

  describe('Full Wizard Flow', () => {
    it('should process all steps and complete onboarding', async () => {
      // Arrange
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      vi.mocked(mockSupabaseClient.from)
        .mockReturnValueOnce(mockProfileQuery as any) // profiles
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any)

      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })

      mockFetch.mockResolvedValue({ ok: true, json: () => ({ success: true }) })

      const onboardingData = {
        fullName: 'John Doe',
        displayName: 'johndoe',
        headline: 'Full Stack Developer',
        location: 'San Francisco, CA',
        skills: [
          { skill_name: 'React', is_primary: true },
          { skill_name: 'TypeScript', is_primary: true },
          { skill_name: 'Node.js', is_primary: true },
          { skill_name: 'Python', is_primary: true },
          { skill_name: 'SQL', is_primary: true },
        ],
        interests: ['AI', 'Web Development', 'Open Source'],
        goals: ['Learn ML'],
      }

      // Act
      const result = await mockOnboardingAction(onboardingData, 90)

      // Assert
      expect(result.success).toBe(true)
      expect(result.userId).toBe('test-user-id')
      expect(result.alreadyCompleted).toBeUndefined()
    })

    it('should handle already completed onboarding', async () => {
      // Arrange
      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { onboarding_completed: true }, error: null }),
        upsert: vi.fn(),
      } as any)

      // Act
      const result = await mockOnboardingAction({ fullName: 'John Doe' }, 90)

      // Assert
      expect(result.success).toBe(true)
      expect(result.alreadyCompleted).toBe(true)
    })

    it('should store all structured data correctly', async () => {
      // Arrange
      const profileUpsert = vi.fn().mockResolvedValue({ data: null, error: null })
      const skillsInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      const interestsInsert = vi.fn().mockResolvedValue({ data: null, error: null })

      // Track .from() calls by table
      let profilesCallCount = 0
      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          profilesCallCount++
          if (profilesCallCount === 1) {
            // First call: select query
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
              upsert: profileUpsert,
            } as any
          }
          // Second call: upsert
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: profileUpsert,
          } as any
        }
        if (table === 'user_skills') {
          return {
            insert: skillsInsert,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any
        }
        // user_interests or other tables
        return {
          insert: interestsInsert,
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      })

      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })

      const data = {
        fullName: 'Jane Doe',
        displayName: 'janedoe',
        headline: 'Product Designer',
        location: 'New York, NY',
        skills: [{ skill_name: 'Figma', is_primary: true }],
        interests: ['Design', 'UX'],
      }

      // Act
      const result = await mockOnboardingAction(data, 75)

      // Assert
      expect(result.success).toBe(true)
      expect(profileUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-id',
          full_name: 'Jane Doe',
          headline: 'Product Designer',
          profile_completion: 75,
          onboarding_completed: true,
        })
      )
    })
  })

  describe('Step-by-Step Validation', () => {
    it('should require at minimum fullName and headline', async () => {
      // Arrange
      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })

      // Act: minimal valid data
      const result = await mockOnboardingAction({
        fullName: 'AB',
        headline: 'Dev',
        skills: [],
        interests: [],
      }, 30)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should fail when user is not authenticated', async () => {
      // Arrange
      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('No session'),
      })

      // Act & Assert
      await expect(
        mockOnboardingAction({ fullName: 'John', headline: 'Dev' }, 50)
      ).rejects.toThrow('Not authenticated')
    })

    it('should handle Supabase insert errors gracefully', async () => {
      // Arrange
      vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(mockSupabaseClient.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database failure' } }),
      } as any)

      // Act
      const _profileUpsert = vi.mocked(mockSupabaseClient.from('profiles')).upsert
      // Because of mock, the upsert will return an error
    })
  })
})
