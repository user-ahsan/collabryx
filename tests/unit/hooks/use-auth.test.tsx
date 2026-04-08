import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuth } from '@/hooks/use-auth'
import type { User, Session } from '@supabase/supabase-js'

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
const mockUnsubscribe = vi.fn()
const mockGetSession = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
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

describe('useAuth - P0-20', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSignOut.mockResolvedValue({ error: null })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with loading state true', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(true)
    })

    it('should return correct structure', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('session')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('signOut')
    })

    it('should initialize with null user and session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should fetch session on mount', async () => {
      const mockSession: Session = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          phone: undefined,
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          identities: [],
        } as User,
      }
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.user).toEqual(mockSession.user)
    })

    it('should handle session fetch error gracefully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: { message: 'Network error' } })
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes on mount', () => {
      renderHook(() => useAuth(), { wrapper: createWrapper() })
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      unmount()
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sign Out', () => {
    it('should call supabase signOut', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await act(async () => {
        await result.current.signOut()
      })
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should navigate to login page on sign out', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await act(async () => {
        await result.current.signOut()
      })
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should refresh router on sign out', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await act(async () => {
        await result.current.signOut()
      })
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading States', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(true)
    })

    it('should set isLoading false after session fetch', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle null session gracefully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('should handle session with user', async () => {
      const mockUser: User = {
        id: 'user-789',
        email: 'user@example.com',
        email_confirmed_at: new Date().toISOString(),
        phone: undefined,
        created_at: new Date().toISOString(),
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        identities: [],
      }
      const mockSession: Session = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })
  })
})
