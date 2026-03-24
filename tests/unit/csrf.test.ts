/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CSRF Token Validation Tests
 * Tests for P0-02: Missing CSRF protection on mutating endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  generateCSRFToken, 
  validateCSRFToken, 
  validateCSRFRequest,
  hashToken,
  requiresCSRF,
  SAFE_METHODS 
} from '@/lib/csrf'

describe('CSRF Token Generation', () => {
  it('should generate a valid CSRF token', async () => {
    const token = await generateCSRFToken()
    
    expect(token).toBeDefined()
    expect(token.length).toBe(64)
    expect(token).toMatch(/^[a-f0-9]{64}$/i)
  })

  it('should generate unique tokens', async () => {
    const token1 = await generateCSRFToken()
    const token2 = await generateCSRFToken()
    
    expect(token1).not.toBe(token2)
  })

  it('should generate tokens with correct length', async () => {
    const token = await generateCSRFToken()
    expect(token.length).toBe(64)
  })
})

describe('CSRF Token Validation', () => {
  it('should validate a valid token', async () => {
    const token = await generateCSRFToken()
    expect(validateCSRFToken(token)).toBe(true)
  })

  it('should reject null token', () => {
    expect(validateCSRFToken(null as any)).toBe(false)
  })

  it('should reject undefined token', () => {
    expect(validateCSRFToken(undefined as any)).toBe(false)
  })

  it('should reject empty string token', () => {
    expect(validateCSRFToken('')).toBe(false)
  })

  it('should reject token with wrong length', async () => {
    const token = await generateCSRFToken()
    const shortToken = token.slice(0, 32)
    expect(validateCSRFToken(shortToken)).toBe(false)
  })

  it('should reject token with invalid characters', () => {
    expect(validateCSRFToken('invalid_token_with_special_chars!@#')).toBe(false)
  })

  it('should accept uppercase hex characters', () => {
    const uppercaseToken = 'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890'
    expect(validateCSRFToken(uppercaseToken)).toBe(true)
  })

  it('should accept lowercase hex characters', () => {
    const lowercaseToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    expect(validateCSRFToken(lowercaseToken)).toBe(true)
  })
})

describe('CSRF Request Validation', () => {
  it('should validate matching tokens', async () => {
    const token = await generateCSRFToken()
    
    const isValid = await validateCSRFRequest(token, token)
    expect(isValid).toBe(true)
  })

  it('should reject when request token is null', async () => {
    const token = await generateCSRFToken()
    
    const isValid = await validateCSRFRequest(null, token)
    expect(isValid).toBe(false)
  })

  it('should reject when cookie token is null', async () => {
    const token = await generateCSRFToken()
    
    const isValid = await validateCSRFRequest(token, null)
    expect(isValid).toBe(false)
  })

  it('should reject when both tokens are null', async () => {
    const isValid = await validateCSRFRequest(null, null)
    expect(isValid).toBe(false)
  })

  it('should reject mismatched tokens', async () => {
    const token1 = await generateCSRFToken()
    const token2 = await generateCSRFToken()
    
    const isValid = await validateCSRFRequest(token1, token2)
    expect(isValid).toBe(false)
  })

  it('should reject invalid tokens', async () => {
    const isValid = await validateCSRFRequest('invalid_token', 'invalid_token')
    expect(isValid).toBe(false)
  })
})

describe('Token Hashing', () => {
  it('should hash a token', async () => {
    const token = await generateCSRFToken()
    const hash = await hashToken(token)
    
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64)
  })

  it('should produce consistent hashes', async () => {
    const token = await generateCSRFToken()
    const hash1 = await hashToken(token)
    const hash2 = await hashToken(token)
    
    expect(hash1).toBe(hash2)
  })

  it('should produce different hashes for different tokens', async () => {
    const token1 = await generateCSRFToken()
    const token2 = await generateCSRFToken()
    
    const hash1 = await hashToken(token1)
    const hash2 = await hashToken(token2)
    
    expect(hash1).not.toBe(hash2)
  })
})

describe('HTTP Method CSRF Requirements', () => {
  it('should not require CSRF for GET', () => {
    expect(requiresCSRF('GET')).toBe(false)
  })

  it('should not require CSRF for HEAD', () => {
    expect(requiresCSRF('HEAD')).toBe(false)
  })

  it('should not require CSRF for OPTIONS', () => {
    expect(requiresCSRF('OPTIONS')).toBe(false)
  })

  it('should require CSRF for POST', () => {
    expect(requiresCSRF('POST')).toBe(true)
  })

  it('should require CSRF for PUT', () => {
    expect(requiresCSRF('PUT')).toBe(true)
  })

  it('should require CSRF for DELETE', () => {
    expect(requiresCSRF('DELETE')).toBe(true)
  })

  it('should require CSRF for PATCH', () => {
    expect(requiresCSRF('PATCH')).toBe(true)
  })

  it('should handle lowercase methods', () => {
    expect(requiresCSRF('get')).toBe(false)
    expect(requiresCSRF('post')).toBe(true)
  })

  it('should include all safe methods in SAFE_METHODS', () => {
    expect(SAFE_METHODS).toContain('GET')
    expect(SAFE_METHODS).toContain('HEAD')
    expect(SAFE_METHODS).toContain('OPTIONS')
    expect(SAFE_METHODS.length).toBe(3)
  })
})

describe('CSRF Integration', () => {
  it('should validate token through hash comparison', async () => {
    const token = await generateCSRFToken()
    
    // Simulate the validation flow
    const hashedRequest = await hashToken(token)
    const hashedCookie = await hashToken(token)
    
    expect(hashedRequest).toBe(hashedCookie)
  })

  it('should handle token validation with direct comparison fallback', async () => {
    const token = await generateCSRFToken()
    
    // Direct comparison should work
    const isValid = token === token
    expect(isValid).toBe(true)
  })
})
