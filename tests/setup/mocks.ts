import { vi } from 'vitest'

// Mock Supabase client with proper chainable methods
export const createMockSupabaseClient = () => {
  const client = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ data: [], error: null }),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ subscription: { unsubscribe: vi.fn() } }),
    },
  }
  return client
}

export const mockSupabaseClient = createMockSupabaseClient()

// Mock @supabase/ssr directly to prevent environment variable errors
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock React Query
export const mockQueryClient = {
  query: vi.fn(),
  mutate: vi.fn(),
  fetchQuery: vi.fn(),
  prefetchQuery: vi.fn(),
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
  resetQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
}
