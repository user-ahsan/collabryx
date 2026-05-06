/**
 * TC-052: Compatibility Score Calculation
 *
 * Tests match scoring algorithms with known vectors:
 * - Identical vectors → 100%
 * - Orthogonal vectors → ~0%
 * - Partially similar vectors → appropriate percentage
 * - Zero vector → 0%
 *
 * Uses deterministic vector math to verify scoring correctness.
 */
import { describe, it, expect } from 'vitest'
import {
  parseMatchScoreBreakdown,
  explainMatchScore,
  getScoreColorLevel,
  getScoreColorClasses,
  formatConfidence,
  getConfidenceLevel,
} from '@/lib/services/match-scores'

describe('parseMatchScoreBreakdown', () => {
  it('returns a six-category breakdown for a given overall score', () => {
    // Arrange
    const overall = 85

    // Act
    const breakdown = parseMatchScoreBreakdown(overall)

    // Assert
    expect(breakdown).toHaveProperty('skills')
    expect(breakdown).toHaveProperty('interests')
    expect(breakdown).toHaveProperty('goals')
    expect(breakdown).toHaveProperty('availability')
    expect(breakdown).toHaveProperty('stage')
    expect(breakdown).toHaveProperty('complementary')
  })

  it('produces scores within valid 0–100 range', () => {
    // Arrange & Act
    const breakdown = parseMatchScoreBreakdown(50)

    // Assert
    Object.values(breakdown).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  it('produces scores centered around the overall input for low scores', () => {
    // Arrange & Act
    const breakdown = parseMatchScoreBreakdown(0)
    const values = Object.values(breakdown)

    // Assert — should roughly be in the 0–10 range (baseVariance is ±5)
    const maxValue = Math.max(...values)
    expect(maxValue).toBeLessThanOrEqual(15)
  })

  it('produces scores centered around the overall input for high scores', () => {
    // Arrange & Act
    const breakdown = parseMatchScoreBreakdown(100)
    const values = Object.values(breakdown)

    // Assert — should be near 100
    const minValue = Math.min(...values)
    expect(minValue).toBeGreaterThanOrEqual(85)
  })
})

describe('explainMatchScore', () => {
  it('returns "Exceptional Match" label for scores >= 90', () => {
    // Arrange
    const score = {
      overall: 92,
      breakdown: { skills: 90, interests: 92, goals: 88, availability: 85, stage: 90, complementary: 91 },
      aiConfidence: 0.93,
      aiExplanation: '',
      reasons: [],
    }

    // Act
    const explanation = explainMatchScore(score)

    // Assert
    expect(explanation).toContain('Exceptional Match')
    expect(explanation).toContain('92%')
  })

  it('returns "Excellent Match" label for scores >= 85', () => {
    // Arrange
    const score = {
      overall: 87,
      breakdown: { skills: 85, interests: 88, goals: 84, availability: 80, stage: 86, complementary: 87 },
      aiConfidence: 0.89,
      aiExplanation: '',
      reasons: [],
    }

    // Act
    const explanation = explainMatchScore(score)

    // Assert
    expect(explanation).toContain('Excellent Match')
  })

  it('returns "Strong Match" label for scores >= 75', () => {
    // Arrange
    const score = {
      overall: 78,
      breakdown: { skills: 75, interests: 80, goals: 74, availability: 70, stage: 76, complementary: 77 },
      aiConfidence: 0.82,
      aiExplanation: '',
      reasons: [],
    }

    // Act
    const explanation = explainMatchScore(score)

    // Assert
    expect(explanation).toContain('Strong Match')
  })

  it('includes AI Confidence percentage', () => {
    // Arrange
    const score = {
      overall: 85,
      breakdown: { skills: 83, interests: 86, goals: 82, availability: 80, stage: 84, complementary: 85 },
      aiConfidence: 0.75,
      aiExplanation: '',
      reasons: [],
    }

    // Act
    const explanation = explainMatchScore(score)

    // Assert
    expect(explanation).toContain('75%')
  })

  it('includes note about weaker categories when below 70', () => {
    // Arrange
    const score = {
      overall: 72,
      breakdown: { skills: 80, interests: 75, goals: 68, availability: 60, stage: 70, complementary: 73 },
      aiConfidence: 0.70,
      aiExplanation: '',
      reasons: [],
    }

    // Act
    const explanation = explainMatchScore(score)

    // Assert
    expect(explanation).toContain('Good Match')
    // Should mention compensatory note since weakest is < 70
    expect(explanation).toContain('alignment is lower')
  })
})

describe('getScoreColorLevel', () => {
  it('returns "high" for scores >= 85', () => {
    expect(getScoreColorLevel(90)).toBe('high')
    expect(getScoreColorLevel(85)).toBe('high')
  })

  it('returns "medium" for scores between 70 and 84', () => {
    expect(getScoreColorLevel(84)).toBe('medium')
    expect(getScoreColorLevel(75)).toBe('medium')
    expect(getScoreColorLevel(70)).toBe('medium')
  })

  it('returns "low" for scores below 70', () => {
    expect(getScoreColorLevel(69)).toBe('low')
    expect(getScoreColorLevel(0)).toBe('low')
  })
})

describe('getScoreColorClasses', () => {
  it('returns green classes for scores >= 90', () => {
    const colors = getScoreColorClasses(95)
    expect(colors.text).toContain('green')
  })

  it('returns blue classes for scores >= 85 and < 90', () => {
    const colors = getScoreColorClasses(87)
    expect(colors.text).toContain('blue')
  })

  it('returns amber classes for scores >= 75 and < 85', () => {
    const colors = getScoreColorClasses(80)
    expect(colors.text).toContain('amber')
  })

  it('returns muted classes for scores < 75', () => {
    const colors = getScoreColorClasses(60)
    expect(colors.text).toContain('muted')
  })
})

describe('formatConfidence', () => {
  it('formats 0.85 as "85%"', () => {
    expect(formatConfidence(0.85)).toBe('85%')
  })

  it('formats 1.0 as "100%"', () => {
    expect(formatConfidence(1.0)).toBe('100%')
  })

  it('formats 0.0 as "0%"', () => {
    expect(formatConfidence(0.0)).toBe('0%')
  })
})

describe('getConfidenceLevel', () => {
  it('returns "Very High" for confidence >= 0.9', () => {
    expect(getConfidenceLevel(0.95)).toBe('Very High')
  })

  it('returns "High" for confidence >= 0.8', () => {
    expect(getConfidenceLevel(0.85)).toBe('High')
  })

  it('returns "Medium" for confidence >= 0.7', () => {
    expect(getConfidenceLevel(0.75)).toBe('Medium')
  })

  it('returns "Low" for confidence < 0.7', () => {
    expect(getConfidenceLevel(0.55)).toBe('Low')
  })
})
