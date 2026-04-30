import { describe, it, expect } from 'vitest'
import type {
  UserProfileContext,
  RetrievedContext,
  SessionSummary,
  RAGContext,
  FallbackContext,
  AIMessage
} from '@/lib/rag/types'

describe('RAG Types', () => {
  describe('UserProfileContext', () => {
    it('should accept valid user profile context', () => {
      const profile: UserProfileContext = {
        user_id: '123',
        display_name: 'John Doe',
        headline: 'Software Engineer',
        bio: 'I love building things',
        looking_for: ['mentorship', 'collaboration'],
        skills: [
          { skill_name: 'TypeScript', proficiency: 'expert' },
          { skill_name: 'React' }
        ],
        interests: [{ interest: 'AI' }, { interest: 'Web Development' }],
        career_level: 'mid-career',
        location: 'San Francisco'
      }
      
      expect(profile.user_id).toBe('123')
      expect(profile.career_level).toBe('mid-career')
    })

    it('should allow optional fields to be null', () => {
      const profile: UserProfileContext = {
        user_id: '456',
        display_name: 'Jane Doe',
        headline: null,
        bio: null,
        looking_for: [],
        skills: [],
        interests: []
      }
      
      expect(profile.headline).toBeNull()
      expect(profile.bio).toBeNull()
    })
  })

  describe('RetrievedContext', () => {
    it('should accept valid retrieved context', () => {
      const context: RetrievedContext = {
        content: 'This is retrieved content about TypeScript',
        score: 0.85,
        source: 'vector',
        metadata: { user_id: '789' }
      }
      
      expect(context.score).toBe(0.85)
      expect(context.source).toBe('vector')
    })

    it('should support keyword source', () => {
      const context: RetrievedContext = {
        content: 'Keyword matched content',
        score: 0.72,
        source: 'keyword'
      }
      
      expect(context.source).toBe('keyword')
    })
  })

  describe('SessionSummary', () => {
    it('should accept valid session summary', () => {
      const summary: SessionSummary = {
        summary_text: 'Discussed career goals and technical skills',
        action_items: ['Schedule follow-up meeting', 'Review portfolio'],
        skills_identified: ['TypeScript', 'Leadership'],
        message_count: 15
      }
      
      expect(summary.action_items).toHaveLength(2)
      expect(summary.message_count).toBe(15)
    })
  })

  describe('RAGContext', () => {
    it('should combine all context sources', () => {
      const ragContext: RAGContext = {
        profile: {
          user_id: '123',
          display_name: 'Test User',
          headline: null,
          bio: null,
          looking_for: [],
          skills: [],
          interests: []
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [],
        assembled_at: new Date().toISOString()
      }
      
      expect(ragContext.assembled_at).toBeDefined()
    })
  })

  describe('FallbackContext', () => {
    it('should track context availability', () => {
      const fallback: FallbackContext = {
        has_profile: true,
        has_vector_context: false,
        has_summary: true,
        warnings: ['Vector context unavailable, using keyword search']
      }
      
      expect(fallback.has_profile).toBe(true)
      expect(fallback.warnings).toHaveLength(1)
    })
  })

  describe('AIMessage', () => {
    it('should support user role', () => {
      const message: AIMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, I need help with TypeScript',
        created_at: new Date().toISOString()
      }
      
      expect(message.role).toBe('user')
    })

    it('should support assistant role', () => {
      const message: AIMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'I can help with TypeScript',
        created_at: new Date().toISOString()
      }
      
      expect(message.role).toBe('assistant')
    })
  })
})