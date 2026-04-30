import { describe, it, expect } from 'vitest'
import {
  cosineSimilarity,
  dotProduct,
  magnitude,
  normalizeVector,
  batchCosineSimilarity
} from '@/lib/utils/vector-math'

describe('vector-math', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 2, 3]
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
    })

    it('returns 0 for orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
    })

    it('handles 384-dim profile embeddings', () => {
      const a = Array(384).fill(1)
      const b = Array(384).fill(1)
      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5)
    })

    it('returns 0 for zero vector', () => {
      expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
    })

    it('throws error for dimension mismatch', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vectors must have same dimension')
    })
  })

  describe('dotProduct', () => {
    it('calculates correct dot product', () => {
      expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32)
    })

    it('returns 0 for orthogonal vectors', () => {
      expect(dotProduct([1, 0], [0, 1])).toBe(0)
    })
  })

  describe('magnitude', () => {
    it('calculates correct magnitude', () => {
      expect(magnitude([3, 4])).toBeCloseTo(5, 5)
    })

    it('returns 0 for zero vector', () => {
      expect(magnitude([0, 0])).toBe(0)
    })
  })

  describe('normalizeVector', () => {
    it('normalizes to unit vector', () => {
      const normalized = normalizeVector([3, 4])
      expect(magnitude(normalized)).toBeCloseTo(1, 5)
    })

    it('returns same vector for zero vector', () => {
      expect(normalizeVector([0, 0])).toEqual([0, 0])
    })
  })

  describe('batchCosineSimilarity', () => {
    it('calculates similarity against multiple vectors', () => {
      const query = [1, 0, 0]
      const vectors = [[1, 0, 0], [0, 1, 0], [1, 1, 0]]
      const results = batchCosineSimilarity(query, vectors)
      
      expect(results[0]).toBeCloseTo(1, 5)
      expect(results[1]).toBeCloseTo(0, 5)
      expect(results[2]).toBeCloseTo(0.707, 2)
    })
  })
})