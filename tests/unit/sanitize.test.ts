import { describe, it, expect } from 'vitest'
import { stripHtml, sanitizeText, escapeHtml, sanitizeMarkdown } from '@/lib/utils/sanitize'

describe('Sanitize', () => {
  describe('stripHtml', () => {
    it('should handle plain text', () => {
      expect(stripHtml('Hello')).toBe('Hello')
    })

    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello')
    })

    it('should handle mixed content', () => {
      expect(stripHtml('Hello <b>world</b>!')).toBe('Hello world!')
    })

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('')
    })
  })

  describe('sanitizeText', () => {
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
