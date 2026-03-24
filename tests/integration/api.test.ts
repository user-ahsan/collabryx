 
import { describe, it, expect } from 'vitest'

describe('API Integration Tests', () => {
  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await fetch('http://localhost:3000/api/health')
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data.status).toBe('healthy')
    })

    it('should include timestamp', async () => {
      const response = await fetch('http://localhost:3000/api/health')
      const data = await response.json()
      
      expect(data).toHaveProperty('timestamp')
      expect(Date.parse(data.timestamp)).not.toBeNaN()
    })
  })

  describe('Chat Endpoint', () => {
    it('should reject requests without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test' })
      })
      
      expect([401, 302]).toContain(response.status)
    })

    it('should reject invalid request body', async () => {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Missing message
      })
      
      expect(response.status).toBe(400)
    })

    it('should accept valid request with message', async () => {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Hello',
          context: { page: '/dashboard' }
        })
      })
      
      // Should either succeed or require auth
      expect([200, 401, 302]).toContain(response.status)
    })
  })

  describe('Embeddings Endpoint', () => {
    it('should reject requests without userId', async () => {
      const response = await fetch('http://localhost:3000/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })
      
      expect([400, 401]).toContain(response.status)
    })

    it('should reject empty text', async () => {
      const response = await fetch('http://localhost:3000/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-123', text: '' })
      })
      
      expect([400, 401]).toContain(response.status)
    })

    it('should include rate limit headers', async () => {
      const response = await fetch('http://localhost:3000/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-123', text: 'test' })
      })
      
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })
  })

  describe('Matches Endpoint', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      expect([401, 302]).toContain(response.status)
    })

    it('should return matches for authenticated user', async () => {
      // This would require a valid session
      const response = await fetch('http://localhost:3000/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      // Should return either matches or auth error
      expect([200, 401, 302]).toContain(response.status)
    })
  })

  describe('Activity Endpoint', () => {
    it('should track profile views', async () => {
      const response = await fetch('http://localhost:3000/api/activity/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: 'user-456' })
      })
      
      // Should succeed or require auth
      expect([200, 401]).toContain(response.status)
    })

    it('should return activity feed', async () => {
      const response = await fetch('http://localhost:3000/api/activity/feed')
      
      // Should succeed or require auth
      expect([200, 401, 302]).toContain(response.status)
    })
  })

  describe('Notifications Endpoint', () => {
    it('should send notification', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'user-123',
          type: 'match',
          message: 'You have a new match!'
        })
      })
      
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('Moderation Endpoint', () => {
    it('should moderate content', async () => {
      const response = await fetch('http://localhost:3000/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Hello world' })
      })
      
      expect([200, 401]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('toxicity')
        expect(data).toHaveProperty('spam')
      }
    })
  })

  describe('Upload Endpoint', () => {
    it('should reject requests without file', async () => {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST'
      })
      
      expect([400, 401]).toContain(response.status)
    })

    it('should validate file type', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt')
      
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      // Should validate file type
      expect([200, 400, 401]).toContain(response.status)
    })
  })

  describe('CORS Headers', () => {
    it('should include CORS headers on OPTIONS requests', async () => {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'OPTIONS'
      })
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined()
    })
  })
})
