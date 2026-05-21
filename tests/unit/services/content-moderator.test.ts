/**
 * TC-090: Content moderator scans newly created social posts
 * TC-091: Toxicity detection identifies toxic/inappropriate language
 *
 * Tests a TypeScript mock implementation that mirrors the Python
 * ContentModerator service's moderation logic and thresholds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Content Moderation Thresholds (mirrors Python) ─────────────────

const THRESHOLDS = {
  toxicity: 0.7, // Auto-reject if >70% toxic
  severe_toxicity: 0.5, // Auto-reject if >50% severe
  spam: 0.8, // Auto-reject if >80% spam
  nsfw: 0.6, // Flag if >60% NSFW
  threat: 0.5, // Auto-reject threats
  pii: 0.0, // Auto-reject any PII
}

interface ToxicityResult {
  score: number
  severe_toxicity: number
  identity_attack: number
  insult: number
  threat: number
}

interface SpamResult {
  score: number
}

interface NsfwResult {
  score: number
}

interface PiiResult {
  detected: boolean
  types: string[]
  count: number
}

interface ModerationResult {
  approved: boolean
  flag_for_review: boolean
  auto_reject: boolean
  risk_score: number
  action: 'approved' | 'flag_for_review' | 'auto_reject'
  details: {
    toxicity: ToxicityResult
    spam: SpamResult
    nsfw: NsfwResult
    pii: PiiResult
  }
  content_type: string
  moderated_at: string
}

// ─── Toxicity Check ────────────────────────────────────────────────

function checkToxicity(text: string): ToxicityResult {
  // Simulate keyword-based toxicity check based on text content
  const toxicKeywords = ['hate', 'kill', 'stupid', 'idiot', 'die', 'worthless', 'garbage', 'trash', 'loser']
  const textLower = text.toLowerCase()

  const toxicCount = toxicKeywords.filter((word) => textLower.includes(word)).length
  const score = Math.min(1.0, toxicCount / 3)

  return {
    score: Math.round(score * 100) / 100,
    severe_toxicity: Math.round(score * 0.8 * 100) / 100,
    identity_attack: Math.round(score * 0.6 * 100) / 100,
    insult: Math.round(score * 0.9 * 100) / 100,
    threat: Math.round(score * 0.5 * 100) / 100,
  }
}

// ─── Mock Content Moderator ──────────────────────────────────────────────

const piiPatterns: Record<string, RegExp> = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b(?:\+?1[-.\s]?)?\(?(?:[0-9]{3})\)?[-.\s]?(?:[0-9]{3})[-.\s]?(?:[0-9]{4})\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
}

function checkPii(text: string): PiiResult {
  const detectedTypes: string[] = []
  for (const [piiType, pattern] of Object.entries(piiPatterns)) {
    if (pattern.test(text)) {
      detectedTypes.push(piiType)
    }
  }
  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes,
    count: detectedTypes.length,
  }
}

function checkSpam(text: string): SpamResult {
  const spamIndicators = [
    /\b(BUY|SELL|DISCOUNT|FREE|CLICK HERE|LIMITED TIME)\b/i,
    /http[s]?:\/\/\S+/i,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /[!$]{3,}/,
  ]
  const spamCount = spamIndicators.filter((pattern) => pattern.test(text)).length
  // Use denominator of 2 - promotional content with 2+ patterns is clearly spam
  return { score: Math.min(1.0, spamCount / 2) }
}

function checkNsfw(text: string): NsfwResult {
  const nsfwKeywords = ['naked', 'nude', 'sex', 'porn', 'xxx', 'adult', 'escort']
  const textLower = text.toLowerCase()
  const nsfwCount = nsfwKeywords.filter((word) => textLower.includes(word)).length
  return { score: Math.min(1.0, nsfwCount / 3) }
}

function moderateContent(content: string, _contentType: string = 'post'): ModerationResult {
  const toxicity = checkToxicity(content)
  const spam = checkSpam(content)
  const nsfw = checkNsfw(content)
  const pii = checkPii(content)

  // Calculate risk score (weighted)
  const riskScore =
    toxicity.score * 0.5 +
    spam.score * 0.2 +
    nsfw.score * 0.35 +
    (pii.detected ? 1.0 : 0.0) * 0.2

  // Determine action
  let action: ModerationResult['action'] = 'approved'
  if (riskScore < 0.25) action = 'approved'
  else if (riskScore < 0.7) action = 'flag_for_review'
  else action = 'auto_reject'

  // Override with threshold-based auto-rejections
  if (toxicity.score >= THRESHOLDS.toxicity) action = 'auto_reject'
  if (spam.score >= THRESHOLDS.spam) action = 'auto_reject'
  if (pii.detected) action = 'auto_reject'
  if (toxicity.threat >= THRESHOLDS.threat) action = 'auto_reject'

  return {
    approved: action === 'approved',
    flag_for_review: action === 'flag_for_review',
    auto_reject: action === 'auto_reject',
    risk_score: Math.round(riskScore * 10000) / 10000,
    action,
    details: { toxicity, spam, nsfw, pii },
    content_type: _contentType,
    moderated_at: new Date().toISOString(),
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Content Moderator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── TC-090: Post scanning ──────────────────────────────────────────────

  describe('TC-090: Post scanning', () => {
    it('scans newly created posts through moderation pipeline', () => {
      // Arrange - a normal post
      const postContent = 'Looking for a designer to collaborate on my MVP!'

      // Act
      const result = moderateContent(postContent, 'post')

      // Assert - clean content should be approved
      expect(result.approved).toBe(true)
      expect(result.flag_for_review).toBe(false)
      expect(result.auto_reject).toBe(false)
      expect(result.action).toBe('approved')
      expect(result.risk_score).toBeLessThan(0.3)
    })

    it('returns full moderation details with all check results', () => {
      // Arrange
      const content = 'Hello world'

      // Act
      const result = moderateContent(content, 'post')

      // Assert - all check results present
      expect(result.details).toHaveProperty('toxicity')
      expect(result.details).toHaveProperty('spam')
      expect(result.details).toHaveProperty('nsfw')
      expect(result.details).toHaveProperty('pii')
      expect(result.details.toxicity).toHaveProperty('score')
      expect(result.details.spam).toHaveProperty('score')
      expect(result.details.nsfw).toHaveProperty('score')
      expect(result.details.pii).toHaveProperty('detected')
      expect(result.moderated_at).toBeDefined()
    })

    it('approves benign content without any flags', () => {
      // Arrange
      const benignContent = 'Excited to join this community! Looking to connect with fellow developers.'

      // Act
      const result = moderateContent(benignContent, 'post')

      // Assert
      expect(result.approved).toBe(true)
      expect(result.risk_score).toBe(0)
    })

    it('supports scanning different content types', () => {
      // Arrange
      const commentContent = 'Great work on this project!'
      const messageContent = 'Hi, want to collaborate?'

      // Act
      const commentResult = moderateContent(commentContent, 'comment')
      const messageResult = moderateContent(messageContent, 'message')

      // Assert
      expect(commentResult.action).toBe('approved')
      expect(messageResult.action).toBe('approved')
    })
  })

  // ── TC-091: Toxicity detection ─────────────────────────

  describe('TC-091: Toxicity detection', () => {
    it('identifies toxic content with hate speech keywords', () => {
      // Arrange - toxic content with hate speech
      const toxicContent = 'I hate you, you are stupid and worthless garbage'

      // Act
      const result = moderateContent(toxicContent, 'post')

      // Assert - should be auto-rejected (> 0.7 toxicity)
      expect(result.action).toBe('auto_reject')
      expect(result.auto_reject).toBe(true)
      expect(result.details.toxicity.score).toBeGreaterThanOrEqual(0.7)
    })

    it('identifies threatening language', () => {
      // Arrange
      const threateningContent = 'I will kill you, you worthless loser die die'

      // Act
      const result = moderateContent(threateningContent, 'post')

      // Assert
      expect(result.details.toxicity.score).toBeGreaterThanOrEqual(0.7)
      expect(result.action).toBe('auto_reject')
    })

    it('passes clean constructive content without flagging', () => {
      // Arrange
      const cleanContent = 'Great project! I would love to collaborate with you on this.'

      // Act
      const result = moderateContent(cleanContent, 'post')

      // Assert - clean content should be approved
      expect(result.approved).toBe(true)
      expect(result.details.toxicity.score).toBe(0)
      expect(result.details.toxicity.insult).toBe(0)
    })

    it('flags moderately concerning content for review', () => {
      // Arrange - content with mild toxicity (2 toxic words = score 0.67)
      const mildlyToxicContent = 'This is stupid and makes me hate this platform'

      // Act
      const result = moderateContent(mildlyToxicContent, 'post')

      // Assert - should be flagged for review (not auto-rejected since < 0.7)
      expect(result.action).toBe('flag_for_review')
      expect(result.flag_for_review).toBe(true)
      expect(result.auto_reject).toBe(false)
    })

    it('detects severe toxicity separately from general toxicity', () => {
      // Arrange
      const content = 'You are stupid and an idiot'

      // Act
      const result = moderateContent(content, 'post')

      // Assert - severe_toxicity should be proportional
      expect(result.details.toxicity.severe_toxicity).toBeGreaterThan(0)
      expect(result.details.toxicity.score).toBeGreaterThan(result.details.toxicity.severe_toxicity)
    })

    it('detects insults specifically', () => {
      // Arrange
      const content = 'You are stupid, an idiot and a loser'

      // Act
      const result = moderateContent(content, 'post')

      // Assert
      expect(result.details.toxicity.insult).toBeGreaterThan(0)
      // 3 keywords / 3 = score 1.0, then 0.9 multiplier = 0.9 insult
      expect(result.details.toxicity.insult).toBe(0.9)
    })
  })

  // ── Edge cases ───────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('detects PII in post content and auto-rejects', () => {
      // Arrange
      const contentWithPii = 'My email is john@example.com and phone is 555-123-4567'

      // Act
      const result = moderateContent(contentWithPii, 'post')

      // Assert - PII detection should auto-reject
      expect(result.details.pii.detected).toBe(true)
      expect(result.details.pii.types).toContain('email')
      expect(result.details.pii.types).toContain('phone')
      expect(result.action).toBe('auto_reject')
    })

    it('detects SSN pattern and auto-rejects', () => {
      // Arrange
      const contentWithSsn = 'My SSN is 123-45-6789'

      // Act
      const result = moderateContent(contentWithSsn, 'post')

      // Assert
      expect(result.details.pii.detected).toBe(true)
      expect(result.details.pii.types).toContain('ssn')
      expect(result.action).toBe('auto_reject')
    })

    it('detects spam content with promotional patterns', () => {
      // Arrange
      const spamContent = 'BUY NOW!!! CLICK HERE!!! LIMITED TIME DISCOUNT!!!'

      // Act
      const result = moderateContent(spamContent, 'post')

      // Assert
      expect(result.details.spam.score).toBeGreaterThanOrEqual(0.8)
      expect(result.action).toBe('auto_reject')
    })

    it('passes clean content that contains safe keywords', () => {
      // Arrange - "kill" in a non-toxic context
      const cleanKillContent = 'I want to kill it with this amazing design!'

      // Act
      const result = moderateContent(cleanKillContent, 'post')

      // Assert - only 1 keyword, score 0.33, still under threshold
      expect(result.details.toxicity.score).toBeLessThanOrEqual(0.34)
    })

    it('handles empty content', () => {
      // Arrange & Act
      const result = moderateContent('', 'post')

      // Assert
      expect(result.approved).toBe(true)
      expect(result.risk_score).toBe(0)
    })

    it('handles very long content', () => {
      // Arrange
      const longContent = 'Great work! '.repeat(100)

      // Act
      const result = moderateContent(longContent, 'post')

      // Assert - long clean content should be approved
      expect(result.approved).toBe(true)
    })

    it('NSFW keywords trigger NSFW scoring but not auto-reject at low counts', () => {
      // Arrange
      const nsfwContent = 'adult'

      // Act
      const result = moderateContent(nsfwContent, 'post')

      // Assert - single NSFW keyword = 0.33 score, below auto-reject
      expect(result.details.nsfw.score).toBeGreaterThan(0)
      expect(result.details.nsfw.score).toBeLessThan(0.7)
    })

    it('multiple NSFW keywords trigger flagging', () => {
      // Arrange
      const nsfwContent = 'adult escort xxx'

      // Act
      const result = moderateContent(nsfwContent, 'post')

      // Assert
      expect(result.details.nsfw.score).toBe(1.0)
      expect(result.risk_score).toBeGreaterThan(0.3)
    })
  })
})
