import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { useNotifications } from '@/hooks/use-notifications'

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
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

    expect(result.current).toBeDefined()
  })

  it('should return notifications array and loading state', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

    expect(result.current.notifications).toBeDefined()
    expect(Array.isArray(result.current.notifications)).toBe(true)
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('should have markAsRead function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

    expect(result.current.markAsRead).toBeDefined()
    expect(typeof result.current.markAsRead).toBe('function')
  })

  it('should have markAllAsRead function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

    expect(result.current.markAllAsRead).toBeDefined()
    expect(typeof result.current.markAllAsRead).toBe('function')
  })
})
