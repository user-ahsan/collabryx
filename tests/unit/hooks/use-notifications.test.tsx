import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotifications } from '@/hooks/use-notifications'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
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

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    // Mock for notifications query with proper chaining (from -> select -> eq(user_id) -> order)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('should return data and loading state', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(typeof result.current.isLoading).toBe('boolean')
  })
})
