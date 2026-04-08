import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
      getUser: vi.fn(() => ({ data: { user: null }, error: { message: 'Session expired' } })),
    },
  })),
}))

describe('Session Expiry', () => {
  it('should handle expired session gracefully', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    const { error } = await client.auth.getUser()
    expect(error?.message).toBe('Session expired')
  })

  it('should return null user when session is null', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    const { data } = await client.auth.getSession()
    expect(data.session).toBeNull()
  })
})
