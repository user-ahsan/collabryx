import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePosts, useCreatePost, useDeletePost } from '@/hooks/use-posts'

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

describe('usePosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch posts successfully', async () => {
    const { result } = renderHook(() => usePosts(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => usePosts(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should have correct query keys', () => {
    const { result } = renderHook(() => usePosts(), { wrapper: createWrapper() })

    expect(result.current.queryKey).toBeDefined()
    expect(Array.isArray(result.current.queryKey)).toBe(true)
  })
})

describe('useCreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() })

    expect(result.current).toBeDefined()
    expect(result.current.mutate).toBeDefined()
  })

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})

describe('useDeletePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper() })

    expect(result.current).toBeDefined()
    expect(result.current.mutate).toBeDefined()
  })

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})
