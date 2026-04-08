import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  it('should return data and loading state', () => {
    const { result } = renderHook(() => useProfile('test-user-id'), { wrapper: createWrapper() })
    expect(result.current.data).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
  })
})
