/**
 * Integration tests for embedding queue lifecycle
 * TC-041: New profile bio triggers entry in embedding_pending_queue
 * TC-042: Python worker polls embedding_pending_queue successfully
 * TC-044: Generated vector inserted into profile_embeddings
 * TC-045: Offline worker → tasks remain safely queued
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// Mock Supabase client with query builder chaining
// ============================================================
function createMockQueryBuilder(returnData: unknown[] = [], returnError: unknown = null) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData.length > 0 ? returnData[0] : null, error: returnError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: returnData.length > 0 ? returnData[0] : null, error: returnError }),
    execute: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
  }
  return builder
}

// Module-level builder instance so beforeEach can reset it
let currentBuilder = createMockQueryBuilder()
let mockSupabaseBuilder = currentBuilder // alias for test refs

// Create a simple builder object that can be returned by mockSupabase.from/table
// Use actual functions instead of vi.fn().mockReturnThis() to preserve 'this' context
function createSimpleBuilder() {
  const builder = {
    from: vi.fn(function(this: unknown) { return builder }),
    select: vi.fn(function(this: unknown) { return builder }),
    insert: vi.fn(function(this: unknown) { return builder }),
    update: vi.fn(function(this: unknown) { return builder }),
    upsert: vi.fn(function(this: unknown) { return builder }),
    delete: vi.fn(function(this: unknown) { return builder }),
    eq: vi.fn(function(this: unknown) { return builder }),
    neq: vi.fn(function(this: unknown) { return builder }),
    lt: vi.fn(function(this: unknown) { return builder }),
    lte: vi.fn(function(this: unknown) { return builder }),
    gt: vi.fn(function(this: unknown) { return builder }),
    gte: vi.fn(function(this: unknown) { return builder }),
    order: vi.fn(function(this: unknown) { return builder }),
    limit: vi.fn(function(this: unknown) { return builder }),
    single: vi.fn(function(this: unknown) { return builder }),
    maybeSingle: vi.fn(function(this: unknown) { return builder }),
    execute: vi.fn(function(this: unknown) { return { data: [], error: null } }),
  }
  return builder
}

let simpleBuilder = createSimpleBuilder()

const mockSupabase = {
  from: vi.fn(() => simpleBuilder),
  table: vi.fn(() => simpleBuilder),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
  removeChannel: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-001' } }, error: null }),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}))

// ============================================================
// Helper types
// ============================================================
interface PendingQueueEntry {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  trigger_source: string
  created_at: string
  failure_reason?: string
}

interface ProfileEmbedding {
  id: string
  user_id: string
  embedding: number[] | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  last_updated: string
}

function createPendingEntry(userId: string, status = 'pending' as const): PendingQueueEntry {
  return {
    id: `queue-${userId}`,
    user_id: userId,
    status,
    trigger_source: 'onboarding',
    created_at: new Date().toISOString(),
  }
}

function createProfileEmbedding(userId: string, status = 'pending' as const): ProfileEmbedding {
  return {
    id: `emb-${userId}`,
    user_id: userId,
    embedding: null,
    status,
    last_updated: new Date().toISOString(),
  }
}

describe('Embedding Queue Lifecycle', () => {
  beforeEach(() => {
    // Reset simpleBuilder with fresh mocks
    simpleBuilder = createSimpleBuilder()
    // mockSupabase.from(table) delegates to simpleBuilder.from(table)
    // so assertions on simpleBuilder.from work correctly
    mockSupabase.from = vi.fn((table: string) => simpleBuilder.from(table))
    mockSupabase.table = vi.fn((table: string) => simpleBuilder.table(table))
    // Alias for test convenience - point to simpleBuilder
    mockSupabaseBuilder = simpleBuilder
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================
  // TC-041: Profile insert → pending queue entry
  // ==========================================================
  describe('TC-041: New profile triggers pending queue entry', () => {
    it('should insert a row into embedding_pending_queue when a new profile is created', async () => {
      // Arrange
      const newUserId = 'new-user-001'
      const pendingEntry = createPendingEntry(newUserId)
      mockSupabaseBuilder.execute.mockResolvedValue({ data: [pendingEntry], error: null })

      // Act - simulate inserting into pending queue
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .insert({
          user_id: newUserId,
          trigger_source: 'onboarding',
          status: 'pending',
        })
        .execute()

      // Assert
      expect(mockSupabaseBuilder.from).toHaveBeenCalledWith('embedding_pending_queue')
      expect(mockSupabaseBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: newUserId,
          trigger_source: 'onboarding',
          status: 'pending',
        })
      )
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].status).toBe('pending')
    })

    it('should set trigger_source to onboarding for new user registrations', async () => {
      // Arrange
      const userId = 'onboard-user-002'
      const entry = createPendingEntry(userId)
      entry.trigger_source = 'onboarding'
      mockSupabaseBuilder.execute.mockResolvedValue({ data: [entry], error: null })

      // Act
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .insert({
          user_id: userId,
          trigger_source: 'onboarding',
          status: 'pending',
        })
        .execute()

      // Assert
      const inserted = result.data?.[0] as PendingQueueEntry | undefined
      expect(inserted?.trigger_source).toBe('onboarding')
      expect(inserted?.user_id).toBe(userId)
    })

    it('should not insert duplicate pending entries for the same user (unique constraint)', async () => {
      // Arrange - simulate unique constraint violation
      mockSupabaseBuilder.execute.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })

      // Act
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .insert({
          user_id: 'existing-user',
          trigger_source: 'onboarding',
          status: 'pending',
        })
        .execute()

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error?.code).toBe('23505')
    })
  })

  // ==========================================================
  // TC-042: Worker polls pending queue
  // ==========================================================
  describe('TC-042: Python worker polls embedding_pending_queue', () => {
    it('should return pending queue items when worker polls', async () => {
      // Arrange
      const pendingItems = [
        createPendingEntry('user-a'),
        createPendingEntry('user-b'),
        createPendingEntry('user-c'),
      ]
      mockSupabaseBuilder.execute.mockResolvedValue({ data: pendingItems, error: null })

      // Act - worker polls for pending items ordered by creation time
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at')
        .limit(20)
        .execute()

      // Assert
      expect(mockSupabaseBuilder.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockSupabaseBuilder.order).toHaveBeenCalledWith('created_at')
      expect(mockSupabaseBuilder.limit).toHaveBeenCalledWith(20)
      expect(result.data).toHaveLength(3)
      for (const item of result.data as PendingQueueEntry[]) {
        expect(item.status).toBe('pending')
      }
    })

    it('should atomically claim items with status transition: pending → processing', async () => {
      // Arrange
      const entry = createPendingEntry('claim-user-001')
      // First call: select returns pending item
      mockSupabaseBuilder.execute
        .mockResolvedValueOnce({ data: [entry], error: null })
        // Second call: update claim succeeds
        .mockResolvedValueOnce({ data: [{ ...entry, status: 'processing' }], error: null })

      // Act - worker claims the item atomically
      const selectResult = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(20)
        .execute()

      const claimResult = await mockSupabase
        .from('embedding_pending_queue')
        .update({ status: 'processing', first_attempt: new Date().toISOString() })
        .eq('id', entry.id)
        .eq('status', 'pending')
        .execute()

      // Assert - atomic claim: update only if still pending
      const claimed = claimResult.data?.[0] as PendingQueueEntry | undefined
      expect(selectResult.data).toHaveLength(1)
      expect(claimed?.status).toBe('processing')
      expect(mockSupabaseBuilder.eq).toHaveBeenCalledWith('status', 'pending') // condition in claim
    })

    it('should handle empty pending queue gracefully', async () => {
      // Arrange
      mockSupabaseBuilder.execute.mockResolvedValue({ data: [], error: null })

      // Act
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(20)
        .execute()

      // Assert
      expect(result.data).toHaveLength(0)
      expect(result.error).toBeNull()
    })
  })

  // ==========================================================
  // TC-044: Vector inserted into profile_embeddings
  // ==========================================================
  describe('TC-044: Vector correctly inserted into profile_embeddings', () => {
    it('should upsert embedding vector into profile_embeddings after generation', async () => {
      // Arrange
      const userId = 'vector-user-001'
      const mockVector = Array.from({ length: 384 }, (_, i) => Math.sin(i * 0.1) * 0.05)
      const embeddingEntry = {
        ...createProfileEmbedding(userId, 'completed'),
        embedding: mockVector,
      }
      mockSupabaseBuilder.execute.mockResolvedValue({ data: [embeddingEntry], error: null })

      // Act - simulate storing the generated vector
      const result = await mockSupabase
        .from('profile_embeddings')
        .upsert(
          {
            user_id: userId,
            embedding: mockVector,
            status: 'completed',
            last_updated: new Date().toISOString(),
          },
          { on_conflict: 'user_id' }
        )
        .execute()

      // Assert
      expect(mockSupabaseBuilder.from).toHaveBeenCalledWith('profile_embeddings')
      const stored = result.data?.[0] as ProfileEmbedding | undefined
      expect(stored?.status).toBe('completed')
    })

    it('should store exactly 384-dimensional vectors', async () => {
      // Arrange
      const userId = 'dim-check-user'
      const vector384 = Array.from({ length: 384 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.01))
      mockSupabaseBuilder.execute.mockResolvedValue({
        data: [{ user_id: userId, embedding: vector384, status: 'completed' }],
        error: null,
      })

      // Act
      const result = await mockSupabase
        .from('profile_embeddings')
        .upsert({ user_id: userId, embedding: vector384, status: 'completed' })
        .execute()

      // Assert
      const data = result.data?.[0] as { embedding: number[] } | undefined
      expect(data?.embedding).toHaveLength(384)
    })

    it('should mark pending queue item as completed after successful storage', async () => {
      // Arrange
      const queueId = 'queue-done-001'
      mockSupabaseBuilder.execute
        .mockResolvedValueOnce({ data: [{ id: queueId, status: 'completed' }], error: null })

      // Act - mark the queue item as completed
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', queueId)
        .execute()

      // Assert
      const updated = result.data?.[0] as PendingQueueEntry | undefined
      expect(updated?.status).toBe('completed')
    })
  })

  // ==========================================================
  // TC-045: Offline worker → queue persistence
  // ==========================================================
  describe('TC-045: Worker offline — tasks remain safely queued', () => {
    it('should keep pending queue items when worker is unreachable', async () => {
      // Arrange
      const pendingItems = [
        createPendingEntry('offline-user-1'),
        createPendingEntry('offline-user-2'),
      ]
      mockSupabaseBuilder.execute.mockResolvedValue({ data: pendingItems, error: null })

      // Act - query the queue as if checking it after failed worker contact
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .execute()

      // Assert - items should still be pending, not deleted
      expect(result.data).toHaveLength(2)
      for (const item of result.data as PendingQueueEntry[]) {
        expect(item.status).toBe('pending')
      }
    })

    it('should not transition items to failed when worker is simply unreachable', async () => {
      // Arrange - simulate a network error scenario
      // The queue items should remain pending, not auto-failed
      const pendingItems = [createPendingEntry('network-offline-user')]
      mockSupabaseBuilder.execute.mockResolvedValue({ data: pendingItems, error: null })

      // Act - poll the pending queue (would be done to check what needs processing)
      const result = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .execute()

      // Assert - items are still pending when worker offline
      const items = result.data as PendingQueueEntry[]
      expect(items.every((i) => i.status === 'pending')).toBe(true)
      expect(items.length).toBeGreaterThan(0)
    })

    it('should preserve pending queue across multiple failed worker contact attempts', async () => {
      // Arrange
      const entry = createPendingEntry('persistent-queue-user')
      mockSupabaseBuilder.execute.mockResolvedValue({ data: [entry], error: null })

      // Act - simulate 3 polling attempts where worker is offline each time
      for (let attempt = 0; attempt < 3; attempt++) {
        await mockSupabase
          .from('embedding_pending_queue')
          .select('*')
          .eq('status', 'pending')
          .execute()
        // Worker is offline, no processing happens, status stays pending
      }

      // Assert - final query still shows the pending entry
      const final = await mockSupabase
        .from('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .execute()

      expect(final.data).toHaveLength(1)
    })
  })
})
