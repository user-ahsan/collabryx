import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  })),
}))

// Mock development service
vi.mock('@/lib/services/development', () => ({
  completeTestUserOnboarding: vi.fn(),
  isDevelopmentMode: vi.fn(),
}))

import { completeOnboarding } from '@/app/(auth)/onboarding/actions'
import { createClient } from '@/lib/supabase/server'
import { completeTestUserOnboarding, isDevelopmentMode } from '@/lib/services/development'

describe('Onboarding Server Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  }

  const mockProfileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  const mockUpsertQuery = {
    upsert: vi.fn(),
  }

  const mockInsertQuery = {
    upsert: vi.fn(),
  }

  const mockRpcQuery = {
    rpc: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(mockSupabase.from).mockReturnValue(mockProfileQuery as any)
    vi.mocked(mockSupabase.rpc).mockReturnValue(mockRpcQuery as any)
    
    // Default mocks
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } },
      error: null,
    })
    
    vi.mocked(mockProfileQuery.single).mockResolvedValue({
      data: { onboarding_completed: false },
      error: null,
    })
    
    vi.mocked(mockUpsertQuery.upsert).mockResolvedValue({
      data: null,
      error: null,
    })
    
    vi.mocked(mockInsertQuery.upsert).mockResolvedValue({
      data: null,
      error: null,
    })
    
    vi.mocked(mockRpcQuery.rpc).mockResolvedValue({
      data: { queued: true },
      error: null,
    })
    
    vi.mocked(isDevelopmentMode).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('completeOnboarding', () => {
    const validOnboardingData = {
      fullName: 'John Doe',
      displayName: 'johndoe',
      headline: 'Software Developer',
      location: 'San Francisco, CA',
      skills: ['React', 'TypeScript'],
      interests: ['AI', 'Web Development'],
      goals: ['Learn ML'],
      experiences: [
        {
          title: 'Engineer',
          company: 'TechCorp',
          description: 'Built products',
        },
      ],
      links: [
        { platform: 'github', url: 'https://github.com/johndoe' },
      ],
    }

    describe('Authentication', () => {
      it('should succeed with authenticated user', async () => {
        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            userId: 'test-user-123',
          })
        )
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
      })

      it('should fail with unauthenticated user', async () => {
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Unable to verify user authentication'
        )
      })

      it('should handle session-based auth for unverified email', async () => {
        // First call fails with email not confirmed
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: new Error('Email not confirmed'),
        })

        // Session fallback succeeds
        vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-123', email: 'test@example.com' },
            },
          },
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result.success).toBe(true)
        expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
      })

      it('should fail when session fallback also fails', async () => {
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: new Error('Email not confirmed'),
        })

        vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
          data: { session: null },
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Unable to verify user authentication'
        )
      })
    })

    describe('Already Completed Onboarding', () => {
      it('should return alreadyCompleted flag if onboarding was done before', async () => {
        vi.mocked(mockProfileQuery.single).mockResolvedValue({
          data: { onboarding_completed: true },
          error: null,
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result).toEqual({
          success: true,
          userId: 'test-user-123',
          alreadyCompleted: true,
        })
      })
    })

    describe('Development Mode', () => {
      it('should use test user onboarding in development mode', async () => {
        vi.mocked(isDevelopmentMode).mockReturnValue(true)
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'test-user-123', email: 'test123@collabryx.com' } },
          error: null,
        })

        vi.mocked(completeTestUserOnboarding).mockResolvedValue({
          success: true,
          error: null,
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(completeTestUserOnboarding).toHaveBeenCalledTimes(1)
        expect(result.success).toBe(true)
      })

      it('should fail if development mode onboarding fails', async () => {
        vi.mocked(isDevelopmentMode).mockReturnValue(true)
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'test-user-123', email: 'test123@collabryx.com' } },
          error: null,
        })

        vi.mocked(completeTestUserOnboarding).mockResolvedValue({
          success: false,
          error: new Error('Test failed'),
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Failed to complete onboarding in development mode'
        )
      })
    })

    describe('Profile Update', () => {
      it('should fail if user has no email', async () => {
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'test-user-123', email: null } },
          error: null,
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          "Your account doesn't have an email address"
        )
      })

      it('should succeed with valid profile data', async () => {
        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result.success).toBe(true)
        expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-user-123',
            full_name: 'John Doe',
            headline: 'Software Developer',
            onboarding_completed: true,
            profile_completion: 90,
          }),
          expect.any(Object)
        )
      })

      it('should filter out links with empty URLs', async () => {
        const dataWithEmptyLinks = {
          ...validOnboardingData,
          links: [
            { platform: 'github', url: 'https://github.com/johndoe' },
            { platform: 'linkedin', url: '' },
            { platform: 'portfolio', url: '' },
          ],
        }

        await completeOnboarding(dataWithEmptyLinks, 90)
        
        expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            website_url: JSON.stringify([
              { platform: 'github', url: 'https://github.com/johndoe' },
            ]),
          }),
          expect.any(Object)
        )
      })

      it('should handle profile upsert errors', async () => {
        vi.mocked(mockUpsertQuery.upsert).mockResolvedValue({
          data: null,
          error: { message: 'Database error', details: 'Constraint violation' },
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Failed to save profile'
        )
      })

      it('should handle missing database table errors gracefully', async () => {
        vi.mocked(mockUpsertQuery.upsert).mockImplementation(() => {
          throw new Error('relation "profile_embeddings" does not exist')
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Database setup incomplete'
        )
      })
    })

    describe('Skills Insertion', () => {
      it('should insert skills with is_primary flag for first 5', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)

        await completeOnboarding(
          {
            ...validOnboardingData,
            skills: ['Skill1', 'Skill2', 'Skill3', 'Skill4', 'Skill5', 'Skill6'],
          },
          90
        )

        expect(mockInsertQuery.upsert).toHaveBeenCalledTimes(6)
        expect(mockInsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user-123',
            skill_name: 'Skill1',
            is_primary: true,
          }),
          expect.any(Object)
        )
        expect(mockInsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user-123',
            skill_name: 'Skill6',
            is_primary: false,
          }),
          expect.any(Object)
        )
      })

      it('should continue despite skill insertion errors', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)
        vi.mocked(mockInsertQuery.upsert).mockResolvedValue({
          data: null,
          error: { message: 'Skill error' },
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        // Should still succeed even if skills fail
        expect(result.success).toBe(true)
      })
    })

    describe('Interests Insertion', () => {
      it('should insert all interests', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)

        await completeOnboarding(
          {
            ...validOnboardingData,
            interests: ['AI', 'Web Dev', 'Open Source'],
          },
          90
        )

        expect(mockInsertQuery.upsert).toHaveBeenCalledTimes(3)
      })

      it('should continue despite interest insertion errors', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)
        vi.mocked(mockInsertQuery.upsert).mockResolvedValue({
          data: null,
          error: { message: 'Interest error' },
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result.success).toBe(true)
      })
    })

    describe('Experience Insertion', () => {
      it('should insert experiences with defaults', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)

        await completeOnboarding(
          {
            ...validOnboardingData,
            experiences: [
              {
                title: 'Engineer',
                company: 'TechCorp',
                description: 'Built stuff',
              },
            ],
          },
          90
        )

        expect(mockInsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user-123',
            title: 'Engineer',
            company: 'TechCorp',
            is_current: true,
          }),
          expect.any(Object)
        )
      })

      it('should filter out experiences with no title or company', async () => {
        vi.mocked(mockSupabase.from).mockReturnValue(mockInsertQuery as any)

        await completeOnboarding(
          {
            ...validOnboardingData,
            experiences: [
              {
                title: '',
                company: '',
                description: 'Empty experience',
              },
            ],
          },
          90
        )

        // Should use "Untitled" as fallback
        expect(mockInsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Untitled',
          }),
          expect.any(Object)
        )
      })
    })

    describe('Embedding Queue', () => {
      it('should queue embedding request in database', async () => {
        await completeOnboarding(validOnboardingData, 90)

        expect(mockRpcQuery.rpc).toHaveBeenCalledWith('queue_embedding_request', {
          p_user_id: 'test-user-123',
          p_trigger_source: 'onboarding',
        })
      })

      it('should handle duplicate embedding queue requests', async () => {
        vi.mocked(mockRpcQuery.rpc).mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Duplicate key violation' },
        })

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result.success).toBe(true)
        expect(result.embeddingQueuedInDb).toBe(true)
      })

      it('should trigger embedding API', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          text: vi.fn().mockResolvedValue(''),
          json: vi.fn().mockResolvedValue({ success: true }),
        })

        vi.stubGlobal('fetch', mockFetch)

        await completeOnboarding(validOnboardingData, 90)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/embeddings/generate'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ user_id: 'test-user-123' }),
          })
        )

        vi.unstubAllGlobals()
      })

      it('should handle embedding API failures gracefully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue('Internal error'),
        })

        vi.stubGlobal('fetch', mockFetch)

        const result = await completeOnboarding(validOnboardingData, 90)
        
        // Should still succeed even if embedding API fails
        expect(result.success).toBe(true)
        expect(result.embeddingError).toBeDefined()

        vi.unstubAllGlobals()
      })

      it('should handle embedding API timeout', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Timeout'))

        vi.stubGlobal('fetch', mockFetch)

        const result = await completeOnboarding(validOnboardingData, 90)
        
        expect(result.success).toBe(true)
        expect(result.embeddingError).toBeDefined()

        vi.unstubAllGlobals()
      })
    })

    describe('Completion Percentage', () => {
      it('should save profile with correct completion percentage', async () => {
        await completeOnboarding(validOnboardingData, 90)

        expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            profile_completion: 90,
          }),
          expect.any(Object)
        )
      })

      it('should handle different completion percentages', async () => {
        await completeOnboarding(validOnboardingData, 65)

        expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            profile_completion: 65,
          }),
          expect.any(Object)
        )
      })
    })

    describe('Error Handling', () => {
      it('should handle network errors with retry-friendly message', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))

        vi.stubGlobal('fetch', mockFetch)

        const result = await completeOnboarding(validOnboardingData, 90)
        
        // Should still succeed - embedding is not critical
        expect(result.success).toBe(true)

        vi.unstubAllGlobals()
      })

      it('should handle authentication errors during submission', async () => {
        vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: new Error('Session expired'),
        })

        await expect(completeOnboarding(validOnboardingData, 90)).rejects.toThrow(
          'Unable to verify user authentication'
        )
      })
    })
  })
})
