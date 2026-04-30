import { describe, it, expect } from 'vitest'
import { buildEnhancedSystemPrompt, buildFallbackSystemPrompt } from '@/lib/prompt/ai-mentor-prompts'
import type { RAGContext } from '@/lib/rag/types'

describe('ai-mentor-prompts', () => {
  describe('buildFallbackSystemPrompt', () => {
    it('should return a non-empty string', () => {
      const result = buildFallbackSystemPrompt()
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should contain key phrases for mentor guidance', () => {
      const result = buildFallbackSystemPrompt()
      expect(result).toContain('Collabryx AI Mentor')
      expect(result).toContain('career advisor')
      expect(result).toContain('collaboration')
    })

    it('should mention profile and connections guidance', () => {
      const result = buildFallbackSystemPrompt()
      expect(result).toContain('connections')
      expect(result).toContain('profile')
    })

    it('should instruct to be concise and actionable', () => {
      const result = buildFallbackSystemPrompt()
      expect(result).toContain('concise')
      expect(result).toContain('actionable')
    })

    it('should not reveal AI identity', () => {
      const result = buildFallbackSystemPrompt()
      expect(result).not.toContain('I am an AI')
      expect(result).not.toContain('I\'m an AI')
      expect(result).not.toContain('artificial intelligence')
    })
  })

  describe('buildEnhancedSystemPrompt with full context', () => {
    it('should build prompt with all context sections', () => {
      const fullContext: RAGContext = {
        profile: {
          user_id: 'user-123',
          display_name: 'Sarah Chen',
          headline: 'Full Stack Developer',
          bio: 'Passionate about building scalable web applications',
          looking_for: ['collaboration', 'mentorship'],
          skills: [
            { skill_name: 'TypeScript', proficiency: 'advanced' },
            { skill_name: 'React', proficiency: 'advanced' }
          ],
          interests: [
            { interest: 'AI/ML' },
            { interest: 'Open Source' }
          ],
          career_level: 'mid-career',
          location: 'San Francisco'
        },
        retrieved_contexts: [
          {
            content: 'Collaboration best practices for remote teams',
            score: 0.89,
            source: 'vector'
          },
          {
            content: 'How to find technical co-founders',
            score: 0.75,
            source: 'hybrid'
          }
        ],
        session_summary: {
          summary_text: 'Discussed career growth strategies and collaboration opportunities',
          action_items: ['Update LinkedIn profile', 'Join React community'],
          skills_identified: ['leadership', 'communication'],
          message_count: 8
        },
        conversation_history: [
          {
            id: '1',
            role: 'user',
            content: 'I want to find collaboration opportunities',
            created_at: '2026-04-29T10:00:00Z'
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Great! Let me help you find the right connections based on your skills and interests.',
            created_at: '2026-04-29T10:01:00Z'
          }
        ],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(fullContext, 'How can I improve my portfolio?')

      expect(result).toContain('Collabryx AI Mentor')
      expect(result).toContain('## USER CONTEXT')
      expect(result).toContain('Name: Sarah Chen')
      expect(result).toContain('Headline: Full Stack Developer')
      expect(result).toContain('Looking for: collaboration, mentorship')
      expect(result).toContain('Skills: TypeScript, React')
      expect(result).toContain('Career Level: mid-career')
      expect(result).toContain('## RELEVANT KNOWLEDGE')
      expect(result).toContain('Collaboration best practices')
      expect(result).toContain('relevance: 89%')
      expect(result).toContain('## SESSION SUMMARY')
      expect(result).toContain('career growth strategies')
      expect(result).toContain('Previous action items:')
      expect(result).toContain('## CONVERSATION HISTORY')
      expect(result).toContain('How can I improve my portfolio?')
    })
  })

  describe('buildEnhancedSystemPrompt with partial context', () => {
    it('should handle missing profile gracefully', () => {
      const contextWithoutProfile: RAGContext = {
        profile: {
          user_id: 'user-123',
          display_name: 'Test User',
          headline: '',
          bio: null,
          looking_for: [],
          skills: [],
          interests: []
        },
        retrieved_contexts: [
          {
            content: 'Portfolio improvement tips',
            score: 0.85,
            source: 'vector'
          }
        ],
        session_summary: null,
        conversation_history: [],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(contextWithoutProfile, 'Show me tips')

      expect(result).toContain('## USER CONTEXT')
      expect(result).toContain('Name: Test User')
      expect(result).toContain('Headline: Not specified')
      expect(result).toContain('## RELEVANT KNOWLEDGE')
      expect(result).toContain('Portfolio improvement tips')
      expect(result).not.toContain('## SESSION SUMMARY')
      expect(result).not.toContain('## CONVERSATION HISTORY')
    })

    it('should handle empty retrieved contexts', () => {
      const contextWithNoRetrieved: RAGContext = {
        profile: {
          user_id: 'user-456',
          display_name: 'Jane Smith',
          headline: 'Data Scientist',
          bio: null,
          looking_for: ['networking'],
          skills: [{ skill_name: 'Python' }],
          interests: [],
          career_level: 'early-career'
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(contextWithNoRetrieved, 'What should I learn next?')

      expect(result).toContain('Name: Jane Smith')
      expect(result).not.toContain('## RELEVANT KNOWLEDGE')
    })

    it('should handle missing session summary', () => {
      const contextWithoutSummary: RAGContext = {
        profile: {
          user_id: 'user-789',
          display_name: 'Mike Johnson',
          headline: 'Designer',
          bio: null,
          looking_for: [],
          skills: [],
          interests: [],
          career_level: 'senior'
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(contextWithoutSummary, 'Hello')

      expect(result).not.toContain('## SESSION SUMMARY')
    })
  })

  describe('buildEnhancedSystemPrompt output format', () => {
    it('should return a valid prompt string', () => {
      const minimalContext: RAGContext = {
        profile: {
          user_id: 'user-min',
          display_name: 'Min User',
          headline: null,
          bio: null,
          looking_for: [],
          skills: [],
          interests: []
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(minimalContext, 'Test message')

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('## CURRENT MESSAGE')
      expect(result).toContain('User: Test message')
    })

    it('should format conversation history with role labels', () => {
      const contextWithHistory: RAGContext = {
        profile: {
          user_id: 'user-hist',
          display_name: 'History User',
          headline: null,
          bio: null,
          looking_for: [],
          skills: [],
          interests: []
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [
          {
            id: '1',
            role: 'user' as const,
            content: 'I need help with my career',
            created_at: '2026-04-29T10:00:00Z'
          },
          {
            id: '2',
            role: 'assistant' as const,
            content: 'I would be happy to help you with your career path. Let me ask some questions to better understand your goals.',
            created_at: '2026-04-29T10:01:00Z'
          }
        ],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(contextWithHistory, 'What questions?')

      expect(result).toContain('## CONVERSATION HISTORY')
      expect(result).toContain('user: I need help with my career')
      expect(result).toContain('assistant: I would be happy to help')
    })

    it('should truncate long messages in history', () => {
      const longMessage = 'A'.repeat(300)
      const contextWithLongMsg: RAGContext = {
        profile: {
          user_id: 'user-long',
          display_name: 'Long User',
          headline: null,
          bio: null,
          looking_for: [],
          skills: [],
          interests: []
        },
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [
          {
            id: '1',
            role: 'user' as const,
            content: longMessage,
            created_at: '2026-04-29T10:00:00Z'
          }
        ],
        assembled_at: '2026-04-30T10:00:00Z'
      }

      const result = buildEnhancedSystemPrompt(contextWithLongMsg, 'Hi')

      expect(result).toContain('...')
      expect(result).not.toContain(longMessage)
    })
  })
})