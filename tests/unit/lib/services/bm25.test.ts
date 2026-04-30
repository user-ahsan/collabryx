import { describe, it, expect, beforeEach } from 'vitest'
import { BM25 } from '@/lib/services/bm25'
import type { BM25Document } from '@/lib/services/bm25'

describe('BM25', () => {
  describe('index', () => {
    it('should index documents correctly', () => {
      const bm25 = new BM25()
      const docs: BM25Document[] = [
        { id: '1', text: 'React is a JavaScript library' },
        { id: '2', text: 'TypeScript is a typed superset of JavaScript' },
        { id: '3', text: 'Next.js is a React framework' }
      ]
      
      bm25.index(docs)
      
      expect(bm25).toBeDefined()
    })
  })

  describe('search', () => {
    let bm25: BM25
    
    beforeEach(() => {
      bm25 = new BM25()
      bm25.index([
        { id: '1', text: 'React is a JavaScript library for building UI' },
        { id: '2', text: 'TypeScript is a typed superset of JavaScript' },
        { id: '3', text: 'Next.js is a React framework for production' },
        { id: '4', text: 'GraphQL is a query language for APIs' }
      ])
    })

    it('should return relevant documents for query', () => {
      const results = bm25.search('React')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].doc.id).toBe('1')
    })

    it('should order by score descending', () => {
      const results = bm25.search('React TypeScript')
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
      }
    })

    it('should respect limit parameter', () => {
      const results = bm25.search('JavaScript', 1)
      
      expect(results.length).toBe(1)
    })

    it('should return empty for no matches', () => {
      const results = bm25.search('xyz123none')
      
      expect(results.length).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty corpus', () => {
      const bm25 = new BM25()
      bm25.index([])
      
      const results = bm25.search('test')
      expect(results.length).toBe(0)
    })

    it('should handle query with special characters', () => {
      const bm25 = new BM25()
      bm25.index([{ id: '1', text: 'Hello World! @#$%' }])
      
      const results = bm25.search('Hello @#$%')
      expect(results.length).toBe(1)
    })
  })
})