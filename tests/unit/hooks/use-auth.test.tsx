import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuth } from '@/hooks/use-auth'

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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current).toBeDefined()
  })

  it('should return user, session, isLoading, and signOut', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.user).toBeDefined()
    expect(result.current.session).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('should have signOut function', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.signOut).toBeDefined()
    expect(typeof result.current.signOut).toBe('function')
  })
})
