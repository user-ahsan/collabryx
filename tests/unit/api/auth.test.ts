import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(() => ({ 
        data: { user: null }, 
        error: { message: 'Invalid credentials' } 
      })),
    },
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true, response: null })),
}))

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid email format', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid', password: 'password123' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return 401 for invalid credentials', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })
})
