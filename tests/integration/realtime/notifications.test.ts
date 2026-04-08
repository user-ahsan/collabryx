import { describe, it, expect, vi } from 'vitest'
import { fetchNotifications, markNotificationAsRead } from '@/lib/services/notifications'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: null }, error: null })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: null, error: null })),
    })),
  })),
}))

describe('Notifications Service', () => {
  describe('fetchNotifications', () => {
    it('should return error when not authenticated', async () => {
      const result = await fetchNotifications()
      expect(result.error).toBeDefined()
    })
  })

  describe('markNotificationAsRead', () => {
    it('should return error when not authenticated', async () => {
      const result = await markNotificationAsRead('some-id')
      expect(result.error).toBeDefined()
    })
  })
})
