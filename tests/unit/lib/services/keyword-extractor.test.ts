import { describe, it, expect } from 'vitest'
import { extractKeywords, extractFromProfile } from '@/lib/services/keyword-extractor'

describe('keyword-extractor', () => {
  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const keywords = extractKeywords('React is a JavaScript library for building user interfaces')
      
      expect(keywords.length).toBeLessThanOrEqual(20)
      expect(keywords.find(k => k.keyword === 'react')).toBeDefined()
    })

    it('should filter out stop words', () => {
      const keywords = extractKeywords('the a an and or but in on at')
      
      expect(keywords.length).toBe(0)
    })

    it('should filter out short words', () => {
      const keywords = extractKeywords('hi is it be to')
      
      expect(keywords.every(k => k.keyword.length > 2)).toBe(true)
    })

    it('should respect limit parameter', () => {
      const keywords = extractKeywords('one two three four five six seven eight nine ten eleven twelve', 5)
      
      expect(keywords.length).toBe(5)
    })

    it('should score by frequency', () => {
      const text = 'React React React TypeScript TypeScript JavaScript'
      const keywords = extractKeywords(text)
      
      const reactKeyword = keywords.find(k => k.keyword === 'react')
      const tsKeyword = keywords.find(k => k.keyword === 'typescript')
      
      expect(reactKeyword).toBeDefined()
      expect(tsKeyword).toBeDefined()
      expect(reactKeyword!.score).toBeGreaterThan(tsKeyword!.score)
    })
  })

  describe('extractFromProfile', () => {
    it('should combine all profile fields', () => {
      const keywords = extractFromProfile(
        'Senior Software Engineer',
        'Building scalable web applications',
        ['TypeScript', 'React', 'Node.js'],
        ['AI', 'Machine Learning']
      )
      
      expect(keywords).toContain('typescript')
      expect(keywords).toContain('react')
      expect(keywords).toContain('ai')
    })

    it('should handle null headline and bio', () => {
      const keywords = extractFromProfile(null, null, ['JavaScript'], ['Reading'])
      
      expect(keywords).toContain('javascript')
      expect(keywords).toContain('reading')
    })

    it('should return empty array when nothing provided', () => {
      const keywords = extractFromProfile(null, null, [], [])
      
      expect(keywords.length).toBe(0)
    })
  })
})