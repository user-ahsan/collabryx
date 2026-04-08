import { describe, it, expect, vi } from 'vitest'
import { POST, GET } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: null }, error: null })) },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ data: null, error: null })),
      select: vi.fn(() => ({ data: [], error: null })),
    })),
  })),
}))

vi.mock('@/lib/csrf', () => ({
  validateCSRFRequest: vi.fn(() => true),
  requiresCSRF: vi.fn(() => false),
}))

describe('Chat API', () => {
  describe('GET /api/chat', () => {
    it('should return operational status', async () => {
      const response = await GET()
      const data = await response.json()
      expect(data.status).toBe('operational')
    })
  })

  describe('POST /api/chat', () => {
    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should validate message is not empty', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createClient: vi.fn(() => ({
          auth: { getUser: vi.fn(() => ({ data: { user: { id: '123' } }, error: null })) },
          from: vi.fn(() => ({
            insert: vi.fn(() => ({ data: null, error: null })),
            select: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
      }))

      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
