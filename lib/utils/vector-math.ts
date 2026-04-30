export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension')
  }
  const dotProductValue = dotProduct(a, b)
  const magnitudeA = magnitude(a)
  const magnitudeB = magnitude(b)
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProductValue / (magnitudeA * magnitudeB)
}

export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

export function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
}

export function normalizeVector(v: number[]): number[] {
  const mag = magnitude(v)
  if (mag === 0) return v
  return v.map(val => val / mag)
}

export function batchCosineSimilarity(query: number[], vectors: number[][]): number[] {
  return vectors.map(vec => cosineSimilarity(query, vec))
}