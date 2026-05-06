import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionButton } from '@/components/features/connections/connection-button'
import { mockSupabaseClient } from '@/tests/setup/mocks'

// Mock the hooks used by ConnectionButton
vi.mock('@/hooks/use-connections', () => ({
  useCheckConnectionStatus: vi.fn(),
  useSendConnectionRequest: vi.fn(),
}))

// Mock query-cache used by hooks
vi.mock('@/lib/query-cache', () => ({
  QUERY_PRESETS: {
    realtime: { staleTime: 0, gcTime: 5 * 60 * 1000, retry: 1 },
  },
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

describe('ConnectionButton (TC-061)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('TC-061: Send connection request button', () => {
    it('renders "Connect" button when not connected', async () => {
      // Arrange
      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: 'not_connected' as const,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ id: 'conn-new' }),
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      // Act
      render(<ConnectionButton userId="target-user-id" />)

      // Assert
      expect(screen.getByText('Connect')).toBeInTheDocument()
    })

    it('shows "Pending" when request is already sent', async () => {
      // Arrange
      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: 'pending' as const,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      // Act
      render(<ConnectionButton userId="target-user-id" />)

      // Assert
      expect(screen.getByText('⏳ Pending')).toBeInTheDocument()
    })

    it('shows "Connected" when already accepted', async () => {
      // Arrange
      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: 'accepted' as const,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      // Act
      render(<ConnectionButton userId="target-user-id" />)

      // Assert
      expect(screen.getByText('✓ Connected')).toBeInTheDocument()
    })

    it('shows "Loading..." while status is being fetched', async () => {
      // Arrange
      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      // Act
      render(<ConnectionButton userId="target-user-id" />)

      // Assert
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders nothing when user is blocked', async () => {
      // Arrange
      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: 'blocked' as const,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      // Act
      const { container } = render(<ConnectionButton userId="target-user-id" />)

      // Assert: should not render any button (returns null for blocked)
      expect(container.innerHTML).toBe('')
    })

    it('calls sendRequest.mutateAsync when Connect button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const mutateAsyncMock = vi.fn().mockResolvedValue({ id: 'conn-new' })

      const useConnectionsModule = await import('@/hooks/use-connections')
      vi.mocked(useConnectionsModule.useCheckConnectionStatus).mockReturnValue({
        data: 'not_connected' as const,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useConnectionsModule.useCheckConnectionStatus>)

      vi.mocked(useConnectionsModule.useSendConnectionRequest).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useConnectionsModule.useSendConnectionRequest>)

      render(<ConnectionButton userId="target-user-id" />)

      // Act
      const connectButton = screen.getByText('Connect')
      await user.click(connectButton)

      // Assert
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        receiver_id: 'target-user-id',
        message: 'I\'d like to connect with you',
      })
    })
  })
})
