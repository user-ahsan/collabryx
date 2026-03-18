import { describe, it, expect } from 'vitest'
import { sanitizeText, escapeHtml, sanitizeMarkdown } from '../lib/utils/sanitize'

describe('sanitize', () => {
  describe('sanitizeText', () => {
    it('should handle plain text', () => {
      expect(sanitizeText('Hello World')).toBe('Hello World')
    })

    it('should trim whitespace by default', () => {
      expect(sanitizeText('  Hello  ')).toBe('Hello')
    })

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('')
    })

    it('should respect maxLength', () => {
      expect(sanitizeText('Hello World', { maxLength: 5 })).toBe('Hello')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    })

    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })
  })

  describe('sanitizeMarkdown', () => {
    it('should remove script tags', () => {
      const input = '# Hello\n<script>alert("xss")</script>'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('<script>')
    })

    it('should remove event handlers', () => {
      const input = '![img](x "onerror=alert(1)")'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('onerror')
    })
  })
})
