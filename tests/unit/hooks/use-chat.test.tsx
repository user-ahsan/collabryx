import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChat } from '@/hooks/use-chat'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      refresh: mockRefresh,
    }),
  }
})

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRemoveChannel = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    removeChannel: mockRemoveChannel,
    channel: mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: mockSubscribe,
    }),
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    // Default mock for conversations query
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: mockSubscribe,
    })
    mockSubscribe.mockResolvedValue('SUBSCRIBED')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('should return conversations array and loading state', () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() })
    expect(result.current.conversations).toBeDefined()
    expect(Array.isArray(result.current.conversations)).toBe(true)
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('should have selectConversation function', () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() })
    expect(result.current.selectConversation).toBeDefined()
    expect(typeof result.current.selectConversation).toBe('function')
  })

  it('should have refreshConversations function', () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() })
    expect(result.current.refreshConversations).toBeDefined()
    expect(typeof result.current.refreshConversations).toBe('function')
  })
})
