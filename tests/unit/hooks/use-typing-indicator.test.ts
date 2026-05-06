import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { mockSupabaseClient } from '@/tests/setup/mocks'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { app: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } },
}))

describe('useTypingIndicator (TC-069)', () => {
  let mockChannel: {
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      send: vi.fn(),
      unsubscribe: vi.fn(),
    }

    mockSupabaseClient.channel = vi.fn().mockReturnValue(mockChannel)
    mockSupabaseClient.removeChannel = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('TC-069: typing indicator hook', () => {
    it('starts with isTyping as false', () => {
      // Act
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Assert
      expect(result.current.isTyping).toBe(false)
    })

    it('sendTypingEvent broadcasts typing status via Supabase channel', () => {
      // Arrange
      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })

      // Assert - channel.send should have been called with broadcast type
      expect(mockChannel.send).toHaveBeenCalled()
      const sendCallArgs = mockChannel.send.mock.calls[0][0]
      expect(sendCallArgs.type).toBe('broadcast')
      expect(sendCallArgs.event).toBe('typing')
      expect(sendCallArgs.payload).toMatchObject({
        conversation_id: 'conv-123',
        user_id: 'user-1',
        is_typing: true,
      })
    })

    it('clearTypingStatus sends is_typing: false broadcast', () => {
      // Arrange
      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act
      act(() => {
        result.current.clearTypingStatus()
      })

      // Assert
      expect(mockChannel.send).toHaveBeenCalled()
      const sendCallArgs = mockChannel.send.mock.calls[0][0]
      expect(sendCallArgs.payload).toMatchObject({
        conversation_id: 'conv-123',
        user_id: 'user-1',
        is_typing: false,
      })
    })

    it('debounces typing events (does not re-send within 500ms)', () => {
      // Arrange
      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Send first typing event
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })

      // Send again within debounce period
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })

      // Assert: Only 1 send call because debounce prevents duplicate sends
      expect(mockChannel.send).toHaveBeenCalledTimes(1)
    })

    it('allows typing event after debounce period elapses', () => {
      // Arrange
      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Send first event
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })
      expect(mockChannel.send).toHaveBeenCalledTimes(1)

      // Advance time past debounce (500ms)
      act(() => {
        vi.advanceTimersByTime(600)
      })

      // Send again after debounce
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })

      // Assert: 2 sends now
      expect(mockChannel.send).toHaveBeenCalledTimes(2)
    })

    it('subscribes to broadcast typing events from other users', () => {
      // Arrange
      

      // Act
      renderHook(() => useTypingIndicator('conv-123', 'user-1'))

      // Assert: channel created with correct name
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('typing:conv-123')
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()

      // Verify on() was called for broadcast event
      const onCallArgs = mockChannel.on.mock.calls[0]
      expect(onCallArgs[0]).toBe('broadcast')
      expect(onCallArgs[1]).toMatchObject({ event: 'typing' })
    })

    it('sets isTyping to true when receiving broadcast from other user', () => {
      // Arrange
      let broadcastHandler: ((payload: { payload: unknown }) => void) | null = null

      // Intercept channel.on to capture the broadcast handler
      mockChannel.on.mockImplementation((event: string, filter: unknown, handler: unknown) => {
        if (event === 'broadcast' && (filter as { event: string }).event === 'typing') {
          broadcastHandler = handler as (payload: { payload: unknown }) => void
        }
        return mockChannel
      })

      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Simulate incoming broadcast from user-2
      expect(broadcastHandler).not.toBeNull()
      act(() => {
        broadcastHandler!({
          payload: {
            user_id: 'user-2',
            is_typing: true,
          },
        })
      })

      // Assert: isTyping becomes true
      expect(result.current.isTyping).toBe(true)
    })

    it('ignores typing broadcast from self (same userId)', () => {
      // Arrange
      let broadcastHandler: ((payload: { payload: unknown }) => void) | null = null

      mockChannel.on.mockImplementation((event: string, filter: unknown, handler: unknown) => {
        if (event === 'broadcast' && (filter as { event: string }).event === 'typing') {
          broadcastHandler = handler as (payload: { payload: unknown }) => void
        }
        return mockChannel
      })

      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Simulate broadcast from self
      expect(broadcastHandler).not.toBeNull()
      act(() => {
        broadcastHandler!({
          payload: {
            user_id: 'user-1', // Same as current user
            is_typing: true,
          },
        })
      })

      // Assert: isTyping should remain false (ignoring self)
      expect(result.current.isTyping).toBe(false)
    })

    it('auto-clears typing indicator after TYPING_TIMEOUT (2s)', () => {
      // Arrange
      let broadcastHandler: ((payload: { payload: unknown }) => void) | null = null

      mockChannel.on.mockImplementation((event: string, filter: unknown, handler: unknown) => {
        if (event === 'broadcast' && (filter as { event: string }).event === 'typing') {
          broadcastHandler = handler as (payload: { payload: unknown }) => void
        }
        return mockChannel
      })

      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Receive typing from other user
      act(() => {
        broadcastHandler!({
          payload: { user_id: 'user-2', is_typing: true },
        })
      })
      expect(result.current.isTyping).toBe(true)

      // Advance time past TYPING_TIMEOUT (2000ms)
      act(() => {
        vi.advanceTimersByTime(2100)
      })

      // Assert: isTyping should reset to false
      expect(result.current.isTyping).toBe(false)
    })

    it('does not crash when conversationId is undefined', () => {
      // Arrange
      

      // Act
      const { result } = renderHook(() =>
        useTypingIndicator(undefined, 'user-1')
      )

      // Assert: should not throw, and should return default values
      expect(result.current.isTyping).toBe(false)
      // Channel should not have been created
      expect(mockSupabaseClient.channel).not.toHaveBeenCalled()
    })

    it('does not crash when userId is undefined', () => {
      // Arrange
      

      // Act
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', undefined)
      )

      // Assert
      expect(result.current.isTyping).toBe(false)
    })

    it('cleanup on unmount: removes channel and clears timeouts', () => {
      // Arrange
      
      const { unmount } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act
      unmount()

      // Assert: removeChannel should have been called
      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  describe('typing indicator edge cases', () => {
    it('resets debounce timer when new typing events come in rapid succession', () => {
      // Arrange
      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: Send first event
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })
      expect(mockChannel.send).toHaveBeenCalledTimes(1)

      // Fast-forward just under the debounce threshold
      act(() => {
        vi.advanceTimersByTime(400)
      })

      // Still within debounce — this should NOT send
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })
      expect(mockChannel.send).toHaveBeenCalledTimes(1)

      // Now advance past debounce from second call
      act(() => {
        vi.advanceTimersByTime(600)
      })

      // Now it should allow sending
      act(() => {
        result.current.sendTypingEvent('conv-123')
      })
      expect(mockChannel.send).toHaveBeenCalledTimes(2)
    })

    it('handles multiple incoming typing broadcasts correctly', () => {
      // Arrange
      let broadcastHandler: ((payload: { payload: unknown }) => void) | null = null

      mockChannel.on.mockImplementation((event: string, filter: unknown, handler: unknown) => {
        if (event === 'broadcast' && (filter as { event: string }).event === 'typing') {
          broadcastHandler = handler as (payload: { payload: unknown }) => void
        }
        return mockChannel
      })

      
      const { result } = renderHook(() =>
        useTypingIndicator('conv-123', 'user-1')
      )

      // Act: User-2 starts typing
      act(() => {
        broadcastHandler!({ payload: { user_id: 'user-2', is_typing: true } })
      })
      expect(result.current.isTyping).toBe(true)

      // User-2 sends another typing event before timeout
      act(() => {
        vi.advanceTimersByTime(1000)
        broadcastHandler!({ payload: { user_id: 'user-2', is_typing: true } })
      })
      // Still typing (timeout reset)
      expect(result.current.isTyping).toBe(true)

      // Now advance past the reset timeout
      act(() => {
        vi.advanceTimersByTime(2100)
      })
      expect(result.current.isTyping).toBe(false)
    })
  })
})
