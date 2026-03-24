/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest'
import { 
  generateCSRFToken, 
  validateCSRFToken, 
  validateCSRFTokenClient,
  requiresCSRF,
  SAFE_METHODS,
  getCSRFHeaders
} from '@/lib/csrf'

describe('CSRF Protection', () => {
  beforeEach(() => {
    // Clear any state between tests
  })

  describe('generateCSRFToken', () => {
    it('should generate a valid hex token', async () => {
      const token = await generateCSRFToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should generate unique tokens on each call', async () => {
      const token1 = await generateCSRFToken()
      const token2 = await generateCSRFToken()
      
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens in hex format', async () => {
      const token = await generateCSRFToken()
      const hexRegex = /^[a-f0-9]{64}$/i
      
      expect(token).toMatch(hexRegex)
    })
  })

  describe('validateCSRFToken', () => {
    it('should return true for valid 64-char hex token', () => {
      const validToken = 'a'.repeat(64)
      expect(validateCSRFToken(validToken)).toBe(true)
    })

    it('should return false for tokens with wrong length', () => {
      expect(validateCSRFToken('short')).toBe(false)
      expect(validateCSRFToken('a'.repeat(63))).toBe(false)
      expect(validateCSRFToken('a'.repeat(65))).toBe(false)
    })

    it('should return false for empty token', () => {
      expect(validateCSRFToken('')).toBe(false)
    })

    it('should return false for undefined token', () => {
      expect(validateCSRFToken(undefined as any)).toBe(false)
    })

    it('should return false for null token', () => {
      expect(validateCSRFToken(null as any)).toBe(false)
    })

    it('should return false for non-hex characters', () => {
      expect(validateCSRFToken('g'.repeat(64))).toBe(false)
      expect(validateCSRFToken('!'.repeat(64))).toBe(false)
    })

    it('should accept both uppercase and lowercase hex', () => {
      expect(validateCSRFToken('A'.repeat(64))).toBe(true)
      expect(validateCSRFToken('a'.repeat(64))).toBe(true)
      expect(validateCSRFToken('AaBbCcDd'.repeat(8))).toBe(true)
    })
  })

  describe('validateCSRFTokenClient', () => {
    it('should validate tokens client-side', () => {
      const validToken = 'a'.repeat(64)
      expect(validateCSRFTokenClient(validToken)).toBe(true)
    })

    it('should return false for null token', () => {
      expect(validateCSRFTokenClient(null)).toBe(false)
    })

    it('should return false for invalid tokens', () => {
      expect(validateCSRFTokenClient('invalid')).toBe(false)
      expect(validateCSRFTokenClient('a'.repeat(63))).toBe(false)
    })
  })

  describe('requiresCSRF', () => {
    it('should return false for safe methods', () => {
      SAFE_METHODS.forEach(method => {
        expect(requiresCSRF(method)).toBe(false)
      })
    })

    it('should return true for unsafe methods', () => {
      expect(requiresCSRF('POST')).toBe(true)
      expect(requiresCSRF('PUT')).toBe(true)
      expect(requiresCSRF('DELETE')).toBe(true)
      expect(requiresCSRF('PATCH')).toBe(true)
    })

    it('should handle case-insensitive methods', () => {
      expect(requiresCSRF('post')).toBe(true)
      expect(requiresCSRF('Get')).toBe(false)
    })
  })

  describe('getCSRFHeaders', () => {
    it('should return CSRF headers object', () => {
      const token = 'test-token'
      const headers = getCSRFHeaders(token)
      
      expect(headers).toHaveProperty('X-CSRF-Token', token)
      expect(headers).toHaveProperty('Access-Control-Expose-Headers', 'X-CSRF-Token')
    })
  })
})
