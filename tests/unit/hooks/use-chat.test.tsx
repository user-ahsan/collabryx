import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChat } from '@/hooks/use-chat'

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
