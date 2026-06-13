/**
 * Python Worker API Client
 * Handles dev/prod URL automatically via config
 */

import { config } from '@/lib/config'

const WORKER_BASE_URL = config.worker.url

interface WorkerHealthResponse {
  status: 'healthy' | 'unhealthy'
  version: string
  embedding_model_loaded: boolean
  database_connected: boolean
  timestamp: string
}

interface EmbeddingRequest {
  text: string
  user_id: string
}

interface EmbeddingResponse {
  embedding: number[]
  model: string
  processing_time_ms: number
}

export class WorkerClient {
  private baseUrl: string

  constructor(baseUrl: string = WORKER_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async healthCheck(): Promise<WorkerHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      throw new Error(`Worker unhealthy: ${response.status}`)
    }
    return response.json()
  }

  async generateEmbedding(text: string, userId: string): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ text, user_id: userId } satisfies EmbeddingRequest),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.status}`)
    }
    return response.json()
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }
}

export const workerClient = new WorkerClient()

// ============================================================
// Notification Client
// Sends and manages notifications via the notification microservice
// ============================================================

interface NotificationInput {
  userId: string
  type: 'connect' | 'connect_accepted' | 'message' | 'like' | 'comment' | 'comment_like' | 'match' | 'mention' | 'system' | 'achievement'
  content: string
  actorId?: string
  actorName?: string
  actorAvatar?: string
  resourceType?: 'post' | 'profile' | 'conversation' | 'match' | 'comment'
  resourceId?: string
}

interface SendNotificationResult {
  success: boolean
  notificationId?: string
  error?: string
}

interface DigestOptions {
  date?: string
  batchSize?: number
  dryRun?: boolean
}

interface CleanupOptions {
  olderThanDays?: number
  batchSize?: number
  dryRun?: boolean
  userId?: string
}

interface DigestResult {
  digestsQueued: number
  digestsSent: number
  digestsFailed: number
  errors: string[]
}

interface CleanupResult {
  notificationsDeleted: number
  notificationsArchived: number
  errors: string[]
}

export class NotificationClient {
  private baseUrl: string

  constructor(baseUrl: string = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8002') {
    this.baseUrl = baseUrl
  }

  async send(input: NotificationInput): Promise<SendNotificationResult> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      throw new Error(`Notification send failed: ${response.status}`)
    }
    return response.json()
  }

  async sendBulk(inputs: NotificationInput[]): Promise<{ results: SendNotificationResult[] }> {
    const response = await fetch(`${this.baseUrl}/send-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ notifications: inputs }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Notification sendBulk failed: ${response.status}`)
    }
    return response.json()
  }

  async generateDigest(options?: DigestOptions): Promise<DigestResult> {
    const response = await fetch(`${this.baseUrl}/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: options ? JSON.stringify(options) : undefined,
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      throw new Error(`Notification generateDigest failed: ${response.status}`)
    }
    return response.json()
  }

  async cleanupExpired(options?: CleanupOptions): Promise<CleanupResult> {
    const response = await fetch(`${this.baseUrl}/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: options ? JSON.stringify(options) : undefined,
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Notification cleanupExpired failed: ${response.status}`)
    }
    return response.json()
  }
}

// ============================================================
// Feed Client
// Scores and manages feed posts via the feed microservice
// ============================================================

interface FeedScorerInput {
  semantic: number
  engagementSuccesses: number
  engagementFailures: number
  hoursOld: number
  isConnected: boolean
  hasSharedInterests: boolean
  intentMatch: boolean
}

interface ScoredPost {
  postId: string
  score: number
  semantic: number
  engagement: number
  recency: number
  connectionBoost: number
  factors: Record<string, unknown>
}

export class FeedClient {
  private baseUrl: string

  constructor(baseUrl: string = process.env.FEED_SERVICE_URL || 'http://localhost:8003') {
    this.baseUrl = baseUrl
  }

  async scoreById(postId: string, params: FeedScorerInput): Promise<ScoredPost> {
    const response = await fetch(`${this.baseUrl}/score-by-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ post_id: postId, ...params }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      throw new Error(`Feed scoreById failed: ${response.status}`)
    }
    return response.json()
  }

  async scoreFeed(posts: Array<{ postId: string; params: FeedScorerInput }>): Promise<ScoredPost[]> {
    const response = await fetch(`${this.baseUrl}/score-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ posts }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Feed scoreFeed failed: ${response.status}`)
    }
    return response.json()
  }

  async persist(userId: string, scoredPosts: ScoredPost[]): Promise<{ saved: number; failed: number; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/persist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ user_id: userId, posts: scoredPosts }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      throw new Error(`Feed persist failed: ${response.status}`)
    }
    return response.json()
  }
}

// ============================================================
// Match Client
// Generates and manages matches via the match microservice
// ============================================================

interface GenerateMatchesOptions {
  user_id: string
  limit?: number
  min_score?: number
}

interface GeneratedMatch {
  matched_user_id: string
  matched_user_name?: string
  matched_user_role?: string
  matched_user_avatar?: string
  match_percentage: number
  reasons: string[]
  ai_confidence?: number
}

interface BatchMatchItem {
  userId: string
  status: 'success' | 'failed' | 'skipped'
  matchesGenerated?: number
  error?: string
}

interface BatchGenerateOptions {
  userIds: string[]
  limitPerUser?: number
}

export class MatchClient {
  private baseUrl: string

  constructor(baseUrl: string = process.env.MATCH_SERVICE_URL || 'http://localhost:8004') {
    this.baseUrl = baseUrl
  }

  async generate(options: GenerateMatchesOptions): Promise<GeneratedMatch[]> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify(options),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Match generation failed: ${response.status}`)
    }
    const data = await response.json()
    // The match service may return { suggestions: [...] } or the array directly
    return data.suggestions ?? data
  }

  async generateBatch(options: BatchGenerateOptions): Promise<BatchMatchItem[]> {
    const response = await fetch(`${this.baseUrl}/generate-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Worker-API-Key': process.env.WORKER_API_KEY || '' },
      body: JSON.stringify({ user_ids: options.userIds, limit_per_user: options.limitPerUser }),
      signal: AbortSignal.timeout(60000),
    })
    if (!response.ok) {
      throw new Error(`Match generateBatch failed: ${response.status}`)
    }
    const data = await response.json()
    // The match service may return { results: [...] } or the array directly
    return data.results ?? data
  }
}

export const notificationClient = new NotificationClient()
export const feedClient = new FeedClient()
export const matchClient = new MatchClient()
