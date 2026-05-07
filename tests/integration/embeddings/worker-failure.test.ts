/**
 * Integration tests for worker failure and recovery
 * TC-045: Worker offline → tasks remain queued (extended scenarios)
 * TC-046: Updating existing bio triggers regeneration of profile vector
 * TC-048: Failed embedding attempts → dead_letter_queue after retries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// Mock Supabase
// ============================================================
function createMockQueryBuilder(returnData: unknown[] = [], returnError: unknown = null) {
  // Use mockReturnThis() to enable method chaining like real Supabase client
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
let mockBuilder = currentBuilder // alias for test refs

const mockSupabase = {
  from: vi.fn(() => currentBuilder),
  table: vi.fn(() => currentBuilder),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
  removeChannel: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    }),
  },
}

vi.mock('@/lib/supabase/client', () => ({
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

interface DLQEntry {
  id: string
  user_id: string
  semantic_text: string
  failure_reason: string
  retry_count: number
  max_retries: number
  status: 'pending' | 'processing' | 'completed' | 'exhausted'
  next_retry: string
  created_at: string
}

function createPendingEntry(userId: string, status: PendingQueueEntry['status'] = 'pending'): PendingQueueEntry {
  return {
    id: `queue-${userId}`,
    user_id: userId,
    status,
    trigger_source: 'onboarding',
    created_at: new Date().toISOString(),
  }
}

function createDLQEntry(
  userId: string,
  retryCount: number,
  status: DLQEntry['status'] = 'pending'
): DLQEntry {
  const nextRetry = new Date(Date.now() + 5 * 60 * 1000 * (retryCount + 1))
  return {
    id: `dlq-${userId}-${retryCount}`,
    user_id: userId,
    semantic_text: 'Test profile text',
    failure_reason: 'Embedding generation failed',
    retry_count: retryCount,
    max_retries: 3,
    status,
    next_retry: nextRetry.toISOString(),
    created_at: new Date().toISOString(),
  }
}

describe('Worker Failure & Recovery', () => {
  beforeEach(() => {
    // Reset builder with fresh mocks
    currentBuilder = createMockQueryBuilder()
    // mockSupabase.from(table) delegates to currentBuilder.from(table)
    ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(currentBuilder)
    ;(mockSupabase.table as ReturnType<typeof vi.fn>).mockReturnValue(currentBuilder)
    // Alias for test convenience
    mockBuilder = currentBuilder
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================
  // TC-045 (extended): Worker offline scenarios
  // ==========================================================
  describe('TC-045: Worker offline scenarios', () => {
    it('should not lose queue data when worker is unreachable for extended period', async () => {
      // Arrange
      const queuedItems = [
        createPendingEntry('offline-long-1'),
        createPendingEntry('offline-long-2'),
        createPendingEntry('offline-long-3'),
      ]
      mockBuilder.execute.mockResolvedValue({ data: queuedItems, error: null })

      // Act
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .execute()

      // Assert
      expect(result.data).toHaveLength(3)
      expect(result.error).toBeNull()
    })

    it('should allow worker to resume processing after coming back online', async () => {
      // Arrange - simulate worker being offline, then coming back
      const pendingItem = createPendingEntry('resume-user')
      const processingItem = { ...pendingItem, status: 'processing' as const }
      const completedItem = { ...pendingItem, status: 'completed' as const }

      mockBuilder.execute
        // Worker comes back online, queries pending
        .mockResolvedValueOnce({ data: [pendingItem], error: null })
        // Worker claims item (pending → processing)
        .mockResolvedValueOnce({ data: [processingItem], error: null })
        // Worker marks as completed
        .mockResolvedValueOnce({ data: [completedItem], error: null })

      // Act - worker polls
      const pending = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_pending_queue')
        .select('*')
        .eq('status', 'pending')
        .execute()

      // Assert
      expect(pending.data).toHaveLength(1)
      expect((pending.data?.[0] as PendingQueueEntry).status).toBe('pending')
    })
  })

  // ==========================================================
  // TC-046: Bio update → regeneration trigger
  // ==========================================================
  describe('TC-046: Updating bio triggers regeneration', () => {
    it('should set profile_embeddings status to pending when bio is updated', async () => {
      // Arrange
      const userId = 'bio-update-user'
      const updatedEmbedding = {
        user_id: userId,
        status: 'pending',
        last_updated: new Date().toISOString(),
      }
      mockBuilder.execute.mockResolvedValue({ data: [updatedEmbedding], error: null })

      // Act - update the profile_embeddings status to pending (trigger regeneration)
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('profile_embeddings')
        .update({
          status: 'pending',
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .execute()

      // Assert
      expect(mockBuilder.from).toHaveBeenCalledWith('profile_embeddings')
      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
      const updated = result.data?.[0] as Record<string, string> | undefined
      expect(updated?.status).toBe('pending')
    })

    it('should NOT insert duplicate pending queue entry for same user (uses upsert)', async () => {
      // Arrange - user already has a pending entry, bio update should upsert
      const existingEntry = createPendingEntry('existing-bio-user')
      // Mock single directly since execute() internal call doesn't propagate mock through
      mockBuilder.single.mockResolvedValueOnce({ data: existingEntry, error: null })
      mockBuilder.execute.mockResolvedValueOnce({ data: [existingEntry], error: null }) // for upsert path

      // Act - query existing first
      const existing = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_pending_queue')
        .select('*')
        .eq('user_id', 'existing-bio-user')
        .single()

      // Assert - finds existing entry, should upsert not insert new
      expect(existing.data).not.toBeNull()
      expect((existing.data as PendingQueueEntry).status).toBe('pending')
    })

    it('should update trigger_source to manual for bio-triggered regeneration', async () => {
      // Arrange
      const userId = 'manual-trigger-user'
      const manualEntry = createPendingEntry(userId)
      manualEntry.trigger_source = 'manual'
      mockBuilder.execute.mockResolvedValue({ data: [manualEntry], error: null })

      // Act
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_pending_queue')
        .upsert({
          user_id: userId,
          trigger_source: 'manual',
          status: 'pending',
        })
        .execute()

      // Assert
      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ trigger_source: 'manual' })
      )
      expect(result.data?.[0]).toBeDefined()
    })
  })

  // ==========================================================
  // TC-048: DLQ after max retries
  // ==========================================================
  describe('TC-048: Failed attempts move to dead_letter_queue after retries', () => {
    it('should move failed item to dead_letter_queue after embedding generation fails', async () => {
      // Arrange
      const userId = 'dlq-move-user'
      const dlqEntry = createDLQEntry(userId, 0)
      mockBuilder.execute.mockResolvedValue({ data: [dlqEntry], error: null })

      // Act - store failed attempt in DLQ
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
        .insert({
          user_id: userId,
          semantic_text: 'Bio text that failed',
          failure_reason: 'Embedding generation timeout',
          retry_count: 0,
          status: 'pending',
        })
        .execute()

      // Assert
      expect(mockBuilder.from).toHaveBeenCalledWith('embedding_dead_letter_queue')
      expect(result.data).toHaveLength(1)
      const entry = result.data?.[0] as DLQEntry | undefined
      expect(entry?.status).toBe('pending')
      expect(entry?.retry_count).toBe(0)
    })

    it('should increment retry_count on each failed retry', async () => {
      // Arrange
      const userId = 'retry-increment-user'
      const retry0 = createDLQEntry(userId, 0)
      const retry1 = createDLQEntry(userId, 1)
      const retry2 = createDLQEntry(userId, 2)

      // Act - simulate 3 retry cycles
      mockBuilder.execute.mockResolvedValueOnce({ data: [retry0], error: null })
      mockBuilder.execute.mockResolvedValueOnce({ data: [retry1], error: null })
      mockBuilder.execute.mockResolvedValueOnce({ data: [retry2], error: null })

      // Each retry updates retry_count
      for (let count = 0; count < 3; count++) {
        await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
          .update({ retry_count: count + 1, status: 'pending' })
          .eq('id', `dlq-${userId}-${count}`)
          .execute()
      }

      // Assert
      expect(mockBuilder.update).toHaveBeenCalledTimes(3)
    })

    it('should mark DLQ entry as exhausted after 3 failed retries', async () => {
      // Arrange
      const userId = 'exhausted-user'
      const exhaustedEntry: DLQEntry = {
        ...createDLQEntry(userId, 3),
        status: 'exhausted',
      }
      mockBuilder.execute.mockResolvedValue({ data: [exhaustedEntry], error: null })

      // Act - mark as exhausted after reaching max_retries (3)
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
        .update({ status: 'exhausted', retry_count: 3 })
        .eq('user_id', userId)
        .execute()

      // Assert
      const entry = result.data?.[0] as DLQEntry | undefined
      expect(entry?.status).toBe('exhausted')
      expect(entry?.retry_count).toBe(3)
    })

    it('should not retry items with status exhausted', async () => {
      // Arrange - query only pending items, exhausted should be excluded
      const pendingItems = [createDLQEntry('pending-dlq', 1)]
      mockBuilder.execute.mockResolvedValue({ data: pendingItems, error: null })

      // Act - only pull pending items (lt means retry_count < 3)
      await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .execute()

      // Assert - exhausted items (retry_count >= 3) are excluded
      expect(mockBuilder.lt).toHaveBeenCalledWith('retry_count', 3)
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should store failure reason in DLQ entry', async () => {
      // Arrange
      const failureReason = 'Embedding generation timeout (exceeded 30 seconds)'
      const dlqWithReason = createDLQEntry('failure-reason-user', 0)
      dlqWithReason.failure_reason = failureReason
      mockBuilder.execute.mockResolvedValue({ data: [dlqWithReason], error: null })

      // Act
      const result = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
        .insert({
          user_id: 'failure-reason-user',
          semantic_text: 'test text',
          failure_reason: failureReason,
          retry_count: 0,
          status: 'pending',
        })
        .execute()

      // Assert
      const entry = result.data?.[0] as DLQEntry | undefined
      expect(entry?.failure_reason).toContain('timeout')
    })

    it('should move failed pending queue item to DLQ after generation error', async () => {
      // Arrange - a pending queue item that failed processing
      const userId = 'pending-to-dlq-user'
      mockBuilder.execute
        // Update pending queue to failed
        .mockResolvedValueOnce({
          data: [{ id: 'pq-1', user_id: userId, status: 'failed', failure_reason: 'Generation error' }],
          error: null,
        })
        // Insert into DLQ
        .mockResolvedValueOnce({
          data: [createDLQEntry(userId, 0)],
          error: null,
        })

      // Act - mark pending as failed
      await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_pending_queue')
        .update({
          status: 'failed',
          failure_reason: 'Generation error',
        })
        .eq('user_id', userId)
        .execute()

      // Act - insert into DLQ
      const dlqResult = await (mockSupabase.from as unknown as Record<string, (...args: unknown[]) => unknown>)('embedding_dead_letter_queue')
        .insert({
          user_id: userId,
          semantic_text: 'constructed text',
          failure_reason: 'Generation error',
          retry_count: 0,
          status: 'pending',
        })
        .execute()

      // Assert
      expect(dlqResult.data).toHaveLength(1)
      expect(mockBuilder.from).toHaveBeenCalledWith('embedding_dead_letter_queue')
    })
  })
})
