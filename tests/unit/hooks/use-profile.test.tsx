import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { useProfile } from '@/hooks/use-profile'

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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useProfile('test-user-id'), { wrapper: createWrapper() })

    expect(result.current).toBeDefined()
  })

  it('should return profile data and loading state', () => {
    const { result } = renderHook(() => useProfile('test-user-id'), { wrapper: createWrapper() })

    expect(result.current.profile).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.updateProfile).toBe('function')
  })

  it('should have updateProfile function', () => {
    const { result } = renderHook(() => useProfile('test-user-id'), { wrapper: createWrapper() })

    expect(result.current.updateProfile).toBeDefined()
    expect(typeof result.current.updateProfile).toBe('function')
  })

  it('should have refreshProfile function', () => {
    const { result } = renderHook(() => useProfile('test-user-id'), { wrapper: createWrapper() })

    expect(result.current.refreshProfile).toBeDefined()
    expect(typeof result.current.refreshProfile).toBe('function')
  })
})
