import { describe, it, expect, vi } from 'vitest'
import { inferCareerLevel } from '@/lib/rag/context-fetcher'

describe('context-fetcher', () => {
  describe('inferCareerLevel', () => {
    it('should infer executive from CEO/CTO in headline', () => {
      const profile = { display_name: 'Test', headline: 'CEO at Startup', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should infer executive from founder in bio', () => {
      const profile = { display_name: 'Test', headline: null, bio: 'Co-founder of company' }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should infer executive from vp in bio', () => {
      const profile = { display_name: 'Test', headline: null, bio: 'VP of Engineering' }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should infer executive from chief keyword', () => {
      const profile = { display_name: 'Test', headline: 'Chief Technology Officer', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should infer senior from senior keyword', () => {
      const profile = { display_name: 'Test', headline: 'Senior Developer', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from lead keyword', () => {
      const profile = { display_name: 'Test', headline: 'Tech Lead', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from manager keyword', () => {
      const profile = { display_name: 'Test', headline: 'Engineering Manager', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from principal keyword', () => {
      const profile = { display_name: 'Test', headline: 'Principal Engineer', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from director keyword', () => {
      const profile = { display_name: 'Test', headline: 'Director of Engineering', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from staff keyword', () => {
      const profile = { display_name: 'Test', headline: 'Staff Software Engineer', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer senior from head of keyword', () => {
      const profile = { display_name: 'Test', headline: 'Head of Design', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should infer early-career from junior keyword', () => {
      const profile = { display_name: 'Test', headline: 'Junior Developer', bio: null }
      expect(inferCareerLevel(profile, 2)).toBe('early-career')
    })

    it('should infer early-career from intern keyword', () => {
      const profile = { display_name: 'Test', headline: 'Intern', bio: null }
      expect(inferCareerLevel(profile, 1)).toBe('early-career')
    })

    it('should infer early-career from new grad keyword', () => {
      const profile = { display_name: 'Test', headline: 'New Grad', bio: null }
      expect(inferCareerLevel(profile, 1)).toBe('early-career')
    })

    it('should infer early-career from entry keyword', () => {
      const profile = { display_name: 'Test', headline: 'Entry Level Engineer', bio: null }
      expect(inferCareerLevel(profile, 1)).toBe('early-career')
    })

    it('should infer early-career from freshman keyword', () => {
      const profile = { display_name: 'Test', headline: 'Freshman Developer', bio: null }
      expect(inferCareerLevel(profile, 1)).toBe('early-career')
    })

    it('should infer mid-career with high completeness and skills', () => {
      const profile = { display_name: 'Test', headline: 'Developer', bio: 'Experienced dev' }
      expect(inferCareerLevel(profile, 6)).toBe('mid-career')
    })

    it('should infer mid-career with good completeness but fewer skills', () => {
      const profile = { display_name: 'Test', headline: 'Software Engineer', bio: 'Building things' }
      expect(inferCareerLevel(profile, 5)).toBe('mid-career')
    })

    it('should infer early-career with low completeness but some skills', () => {
      const profile = { display_name: 'Test', headline: null, bio: null }
      expect(inferCareerLevel(profile, 2)).toBe('early-career')
    })

    it('should infer early-career when only display_name is present', () => {
      const profile = { display_name: 'Test', headline: null, bio: null }
      expect(inferCareerLevel(profile, 1)).toBe('early-career')
    })

    it('should infer student with minimal profile and no skills', () => {
      const profile = { display_name: 'Test', headline: null, bio: null }
      expect(inferCareerLevel(profile, 0)).toBe('student')
    })

    it('should prioritize executive over senior keywords', () => {
      const profile = { display_name: 'Test', headline: 'Senior CEO', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should prioritize senior over early-career keywords', () => {
      const profile = { display_name: 'Test', headline: 'Senior Junior Developer', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should handle case insensitivity for executive keywords', () => {
      const profile = { display_name: 'Test', headline: 'ceo of startup', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('executive')
    })

    it('should handle case insensitivity for senior keywords', () => {
      const profile = { display_name: 'Test', headline: 'SENIOR DEVELOPER', bio: null }
      expect(inferCareerLevel(profile, 5)).toBe('senior')
    })

    it('should handle case insensitivity for early keywords', () => {
      const profile = { display_name: 'Test', headline: 'JUNIOR DEVELOPER', bio: null }
      expect(inferCareerLevel(profile, 2)).toBe('early-career')
    })
  })
})