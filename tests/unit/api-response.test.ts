import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse } from '@/lib/api-response'

describe('ApiResponse', () => {
  describe('successResponse', () => {
    it('should create success response', () => {
      const result = successResponse({ id: '123', name: 'Test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ id: '123', name: 'Test' })
      }
    })

    it('should preserve data types correctly', () => {
      const result = successResponse({ count: 42, active: true, items: ['a', 'b'] })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.count).toBe(42)
        expect(result.data.active).toBe(true)
        expect(result.data.items).toEqual(['a', 'b'])
      }
    })
  })

  describe('errorResponse', () => {
    it('should create error response', () => {
      const result = errorResponse('Not found', 'NOT_FOUND')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Not found')
        expect(result.code).toBe('NOT_FOUND')
      }
    })

    it('should allow optional details', () => {
      const result = errorResponse('Validation failed', 'VALIDATION', { field: 'email' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.details).toEqual({ field: 'email' })
      }
    })

    it('should handle error without code', () => {
      const result = errorResponse('Something went wrong')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Something went wrong')
        expect(result.code).toBeUndefined()
      }
    })

    it('should allow null details', () => {
      const result = errorResponse('Error', 'ERROR', null)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.details).toBeNull()
      }
    })
  })
})
