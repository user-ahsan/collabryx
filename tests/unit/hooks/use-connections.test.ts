import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabaseClient } from '@/tests/setup/mocks'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { app: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } },
}))

// Ensure sonner toast is mocked
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

const mockRequester = {
  id: 'requester-user-id',
  email: 'requester@example.com',
}

const mockReceiver = {
  id: 'receiver-user-id',
  email: 'receiver@example.com',
}

const pendingConnection = {
  id: 'conn-123',
  requester_id: mockRequester.id,
  receiver_id: mockReceiver.id,
  status: 'pending',
  message: 'Let us connect!',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Connection Service — Accept/Reject (TC-063, TC-064)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockReceiver },
      error: null,
    })
  })

  describe('TC-063: accept connection request', () => {
    it('updates connection status from pending to accepted', async () => {
      // Arrange
      const { acceptConnectionRequest } = await import('@/lib/services/connections')

      let updateCalled = false
      let updatePayload: Record<string, unknown> | null = null

      // First single(): verify receiver owns the request, status is pending
      // Second single(): get requester/receiver IDs for conv creation
      let singleCallCount = 0
      const singleFn = vi.fn().mockImplementation(() => {
        singleCallCount++
        if (singleCallCount === 1) {
          return Promise.resolve({
            data: { receiver_id: mockReceiver.id, status: 'pending' },
            error: null,
          })
        }
        return Promise.resolve({
          data: { requester_id: mockRequester.id, receiver_id: mockReceiver.id },
          error: null,
        })
      })

      const updateChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...pendingConnection, status: 'accepted' },
          error: null,
        }),
      }

      const updateFn = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        updatePayload = payload
        updateCalled = true
        return updateChain
      })

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: updateFn,
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: singleFn,
        limit: vi.fn().mockReturnThis(),
      }

      // Conversation table mock for post-accept conversation creation
      const convInsertFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-conv-id' }, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'connections') {
          return connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>
        }
        if (table === 'conversations') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: convInsertFn,
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as unknown as ReturnType<typeof mockSupabaseClient.from>
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as unknown as ReturnType<typeof mockSupabaseClient.from>
      })

      // Act
      const result = await acceptConnectionRequest('conn-123')

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).not.toBeNull()
      expect(updateCalled).toBe(true)
      expect(updatePayload).toMatchObject({ status: 'accepted' })
      expect(updatePayload).toHaveProperty('updated_at')
    })

    it('rejects acceptance if user is not the receiver', async () => {
      // Arrange
      const { acceptConnectionRequest } = await import('@/lib/services/connections')

      // Verify returns wrong receiver
      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { receiver_id: 'someone-else-id', status: 'pending' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await acceptConnectionRequest('conn-456')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('Not authorized')
    })

    it('rejects acceptance if request is not in pending status', async () => {
      // Arrange
      const { acceptConnectionRequest } = await import('@/lib/services/connections')

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { receiver_id: mockReceiver.id, status: 'accepted' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await acceptConnectionRequest('conn-789')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('no longer pending')
    })
  })

  describe('TC-064: reject/decline connection request', () => {
    it('deletes connection when receiver declines the request', async () => {
      // Arrange
      const { declineConnectionRequest } = await import('@/lib/services/connections')

      let deleteCalled = false

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockImplementation(() => {
          deleteCalled = true
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { receiver_id: mockReceiver.id },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await declineConnectionRequest('conn-123')

      // Assert
      expect(result.error).toBeNull()
      expect(deleteCalled).toBe(true)
    })

    it('rejects decline if user is not the receiver', async () => {
      // Arrange
      const { declineConnectionRequest } = await import('@/lib/services/connections')

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { receiver_id: 'someone-else-id' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await declineConnectionRequest('conn-456')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('Not authorized')
    })

    it('rejects decline when user is not authenticated', async () => {
      // Arrange
      const { declineConnectionRequest } = await import('@/lib/services/connections')

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Act
      const result = await declineConnectionRequest('conn-123')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('log in')
    })
  })

  describe('edge cases: accept/reject', () => {
    it('returns error when accepting a non-existent connection', async () => {
      // Arrange
      const { acceptConnectionRequest } = await import('@/lib/services/connections')

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await acceptConnectionRequest('non-existent-id')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('not found')
    })

    it('returns error when declining a non-existent connection', async () => {
      // Arrange
      const { declineConnectionRequest } = await import('@/lib/services/connections')

      const connectionsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        limit: vi.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(connectionsTable as unknown as ReturnType<typeof mockSupabaseClient.from>)

      // Act
      const result = await declineConnectionRequest('non-existent-id')

      // Assert
      expect(result.error).not.toBeNull()
      expect(result.error!.message).toContain('not found')
    })
  })
})
