import { describe, it, expect, vi } from 'vitest'
import { createPost } from '@/lib/actions/posts.server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: null }, error: { message: 'Not authenticated' } })) },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ data: null, error: { message: 'Insert failed' } })),
    })),
  })),
}))

vi.mock('@/lib/actions/audit.server', () => ({
  withAudit: vi.fn((fn) => fn()),
}))

describe('Posts Server Actions', () => {
  describe('createPost', () => {
    it('should return error when not authenticated', async () => {
      const formData = new FormData()
      formData.append('content', 'Test post')
      
      const result = await createPost(formData)
      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Unauthorized')
      }
    })
  })
})
