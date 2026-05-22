/**
 * TC-058, TC-059: Feed Scorer Tests
 *
 * TC-058: Thompson Sampling for personalized feed ranking
 * TC-059: Hybrid scoring balances new profiles (exploration) with high-compatibility (exploitation)
 *
 * These tests verify the mathematical properties of Thomson Sampling and hybrid
 * scoring logic from the native feed-scorer.ts service.
 */
import { describe, it, expect } from 'vitest'
import {
  seededThompsonSample,
  calculateHybridScore,
  calculateRecencyScore,
  scorePostForUser,
  scoreFeedForUser,
} from '@/lib/services/feed-scorer'

// ============================================
// TC-058: THOMPSON SAMPLING TESTS
// ============================================

describe('TC-058: Thompson Sampling', () => {
  it('popular content with many successes gets higher score than unpopular content', () => {
    const popularScore = seededThompsonSample(100, 20)
    const unpopularScore = seededThompsonSample(5, 50)

    expect(popularScore).toBeGreaterThan(unpopularScore)
  })

  it('arms with equal success/failure ratios approach same score', () => {
    const scoreA = seededThompsonSample(200, 100)
    const scoreB = seededThompsonSample(20, 10)

    const diff = Math.abs(scoreA - scoreB)
    expect(diff).toBeLessThan(0.15)
  })

  it('arms with zero successes still get a non-zero score (exploration)', () => {
    const score = seededThompsonSample(0, 0)

    expect(score).toBeGreaterThan(0)
    expect(score).toBeGreaterThan(0.4)
    expect(score).toBeLessThan(0.6)
  })

  it('arm with pure successes (no failures) approaches 1.0', () => {
    const score = seededThompsonSample(1000, 0)

    expect(score).toBeGreaterThan(0.9)
  })

  it('arm with pure failures (no successes) stays low', () => {
    const score = seededThompsonSample(0, 1000)

    expect(score).toBeLessThan(0.1)
  })

  it('consistent Thompson Sampling converges toward true success rate', () => {
    const trueRate = 0.7
    let successes = 0
    let failures = 0

    for (let round = 0; round < 10; round++) {
      for (let i = 0; i < 100; i++) {
        if (Math.random() < trueRate) {
          successes++
        } else {
          failures++
        }
      }
    }

    const finalScore = seededThompsonSample(successes, failures)

    expect(finalScore).toBeGreaterThan(0.6)
    expect(finalScore).toBeLessThan(0.8)
  })
})

// ============================================
// TC-059: HYBRID SCORING TESTS
// ============================================

describe('TC-059: Hybrid Scoring', () => {
  it('highly compatible profile scores higher than incompatible one', () => {
    const highCompat = {
      semantic: 0.95,
      engagementSuccesses: 50,
      engagementFailures: 5,
      hoursOld: 1,
      isConnected: true,
      hasSharedInterests: true,
      intentMatch: true,
    }

    const lowCompat = {
      semantic: 0.3,
      engagementSuccesses: 3,
      engagementFailures: 40,
      hoursOld: 72,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const highScore = calculateHybridScore(highCompat)
    const lowScore = calculateHybridScore(lowCompat)

    expect(highScore).toBeGreaterThan(lowScore * 2)
  })

  it('new profile with no engagement still gets meaningful score (exploration)', () => {
    const newProfile = {
      semantic: 0.85,
      engagementSuccesses: 0,
      engagementFailures: 0,
      hoursOld: 0.5,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const score = calculateHybridScore(newProfile)

    expect(score).toBeGreaterThan(0.35)
    expect(score).toBeLessThan(0.70)
  })

  it('connection boost increases score compared to non-connected', () => {
    const baseParams = {
      semantic: 0.8,
      engagementSuccesses: 20,
      engagementFailures: 10,
      hoursOld: 2,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const nonConnectedScore = calculateHybridScore(baseParams)
    const connectedScore = calculateHybridScore({ ...baseParams, isConnected: true })
    const ratio = connectedScore / nonConnectedScore

    expect(ratio).toBeGreaterThan(1.2)
  })

  it('shared interests boost increases score', () => {
    const baseParams = {
      semantic: 0.7,
      engagementSuccesses: 15,
      engagementFailures: 15,
      hoursOld: 3,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const withoutInterests = calculateHybridScore(baseParams)
    const withInterests = calculateHybridScore({ ...baseParams, hasSharedInterests: true })
    const ratio = withInterests / withoutInterests

    expect(ratio).toBeGreaterThan(1.1)
  })

  it('intent match boost increases score', () => {
    const baseParams = {
      semantic: 0.75,
      engagementSuccesses: 10,
      engagementFailures: 10,
      hoursOld: 1,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const withoutIntent = calculateHybridScore(baseParams)
    const withIntent = calculateHybridScore({ ...baseParams, intentMatch: true })

    expect(withIntent).toBeGreaterThan(withoutIntent)
  })

  it('recency decay penalizes old content', () => {
    const fresh = {
      semantic: 0.8,
      engagementSuccesses: 20,
      engagementFailures: 10,
      hoursOld: 0.1,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const stale = {
      semantic: 0.8,
      engagementSuccesses: 20,
      engagementFailures: 10,
      hoursOld: 48,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    }

    const freshScore = calculateHybridScore(fresh)
    const staleScore = calculateHybridScore(stale)

    expect(freshScore).toBeGreaterThan(staleScore)
  })

  it('score is capped at 1.0', () => {
    const perfect = {
      semantic: 1.0,
      engagementSuccesses: 1000,
      engagementFailures: 0,
      hoursOld: 0.01,
      isConnected: true,
      hasSharedInterests: true,
      intentMatch: true,
    }

    const score = calculateHybridScore(perfect)

    expect(score).toBeLessThanOrEqual(1.0)
  })

  it('balances exploration (new profile) with exploitation (proven profile)', () => {
    const newProfileScore = calculateHybridScore({
      semantic: 0.9,
      engagementSuccesses: 0,
      engagementFailures: 0,
      hoursOld: 1,
      isConnected: false,
      hasSharedInterests: true,
      intentMatch: true,
    })

    const provenProfileScore = calculateHybridScore({
      semantic: 0.65,
      engagementSuccesses: 200,
      engagementFailures: 20,
      hoursOld: 6,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    })

    expect(newProfileScore).toBeGreaterThan(0.3)
    expect(provenProfileScore).toBeGreaterThan(0.3)

    const diff = Math.abs(newProfileScore - provenProfileScore)
    expect(diff).toBeLessThan(0.5)
  })
})

// ============================================
// SCORE POST FOR USER TESTS
// ============================================

describe('scorePostForUser', () => {
  it('returns a ScoredPost with all factor breakdowns', () => {
    const result = scorePostForUser('post-1', {
      semantic: 0.8,
      engagementSuccesses: 20,
      engagementFailures: 10,
      hoursOld: 2,
      isConnected: true,
      hasSharedInterests: true,
      intentMatch: false,
    })

    expect(result.postId).toBe('post-1')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(1.0)
    expect(result.semantic).toBe(0.8)
    expect(result.engagement).toBeGreaterThan(0)
    expect(result.recency).toBeGreaterThan(0)
    expect(result.connectionBoost).toBeGreaterThan(1)
    expect(result.factors.semantic).toBe(0.8)
    expect(result.factors.connection_boost).toBeGreaterThan(1)
  })

  it('handles zero engagement history', () => {
    const result = scorePostForUser('post-2', {
      semantic: 0.5,
      engagementSuccesses: 0,
      engagementFailures: 0,
      hoursOld: 1,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    })

    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(0.8)
  })

  it('includes boost factors only when applicable', () => {
    const noBoosts = scorePostForUser('post-3', {
      semantic: 0.5,
      engagementSuccesses: 5,
      engagementFailures: 5,
      hoursOld: 10,
      isConnected: false,
      hasSharedInterests: false,
      intentMatch: false,
    })

    expect(noBoosts.factors.shared_interests_boost).toBeUndefined()
    expect(noBoosts.factors.intent_match_boost).toBeUndefined()

    const withBoosts = scorePostForUser('post-4', {
      semantic: 0.5,
      engagementSuccesses: 5,
      engagementFailures: 5,
      hoursOld: 10,
      isConnected: false,
      hasSharedInterests: true,
      intentMatch: true,
    })

    expect(withBoosts.factors.shared_interests_boost).toBe(1.2)
    expect(withBoosts.factors.intent_match_boost).toBe(1.1)
  })
})

// ============================================
// SCORE FEED FOR USER TESTS
// ============================================

describe('scoreFeedForUser', () => {
  it('returns posts sorted by score descending', () => {
    const posts = [
      { postId: 'p1', params: { semantic: 0.2, engagementSuccesses: 0, engagementFailures: 50, hoursOld: 72, isConnected: false, hasSharedInterests: false, intentMatch: false } },
      { postId: 'p2', params: { semantic: 0.9, engagementSuccesses: 100, engagementFailures: 10, hoursOld: 1, isConnected: true, hasSharedInterests: true, intentMatch: true } },
    ]

    const results = scoreFeedForUser(posts)

    expect(results).toHaveLength(2)
    expect(results[0].postId).toBe('p2')
    expect(results[0].score).toBeGreaterThan(results[1].score)
  })

  it('returns empty array for empty input', () => {
    expect(scoreFeedForUser([])).toEqual([])
  })

  it('uses consistent seed for deterministic ranking', () => {
    const posts = [
      { postId: 'p1', params: { semantic: 0.5, engagementSuccesses: 5, engagementFailures: 5, hoursOld: 24, isConnected: false, hasSharedInterests: false, intentMatch: false } },
      { postId: 'p2', params: { semantic: 0.5, engagementSuccesses: 5, engagementFailures: 5, hoursOld: 24, isConnected: false, hasSharedInterests: false, intentMatch: false } },
    ]

    const run1 = scoreFeedForUser(posts, 42)
    const run2 = scoreFeedForUser(posts, 42)

    expect(run1.map(r => r.score)).toEqual(run2.map(r => r.score))
  })
})

// ============================================
// RECENCY SCORE TESTS
// ============================================

describe('calculateRecencyScore', () => {
  it('returns 1.0 for brand new content', () => {
    expect(calculateRecencyScore(0)).toBeCloseTo(1.0)
  })

  it('returns ~0.37 at half-life (24h)', () => {
    const score = calculateRecencyScore(24)
    expect(score).toBeGreaterThan(0.35)
    expect(score).toBeLessThan(0.38)
  })

  it('approaches 0 for very old content', () => {
    const score = calculateRecencyScore(720) // 30 days
    expect(score).toBeLessThan(0.01)
  })
})
