import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeMarkdown } from '@/lib/utils/sanitize'

describe('AI Mentor Response Validation', () => {
  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      const result = sanitizeText('  Hello, this is a normal response!  ')
      expect(result).toBe('Hello, this is a normal response!')
    })

    it('should remove control characters', () => {
      const result = sanitizeText('Hello\x00World')
      expect(result).toBe('HelloWorld')
    })

    it('should respect maxLength option', () => {
      const result = sanitizeText('Hello World', { maxLength: 5 })
      expect(result).toBe('Hello')
    })

    it('should handle normal text', () => {
      const result = sanitizeText('Hello, this is a normal response!')
      expect(result).toBe('Hello, this is a normal response!')
    })
  })

  describe('sanitizeMarkdown', () => {
    it('should remove script tags', () => {
      const result = sanitizeMarkdown('<script>alert("xss")</script>Hello')
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('should remove event handlers', () => {
      const result = sanitizeMarkdown('<img src=x onerror=alert(1)>')
      expect(result).not.toContain('onerror')
    })

    it('should handle normal markdown', () => {
      const result = sanitizeMarkdown('Hello, this is a normal response!')
      expect(result).toBe('Hello, this is a normal response!')
    })
  })
})
