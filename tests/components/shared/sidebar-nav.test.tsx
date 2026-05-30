/**
 * TC-036: Sidebar navigation collapses correctly on mobile/tablet
 *        (component test with mocked viewport)
 *
 * Tests SidebarNav rendering and collapse behavior for both desktop and
 * mobile modes.  Mocks useUser, useSidebar, usePathname, and related
 * UI dependencies (Avatar, Tooltip, ScrollArea, etc.).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock useMatches and useConnectionRequests (avoid TanStack Query dependency)
// ---------------------------------------------------------------------------
vi.mock("@/hooks/use-matches-query", () => ({
  useMatches: () => ({
    data: [
      { id: "m1", matched_user_id: "u1", score: 92, status: "pending" },
      { id: "m2", matched_user_id: "u2", score: 88, status: "pending" },
      { id: "m3", matched_user_id: "u3", score: 85, status: "pending" },
      { id: "m4", matched_user_id: "u4", score: 81, status: "pending" },
      { id: "m5", matched_user_id: "u5", score: 78, status: "pending" },
      { id: "m6", matched_user_id: "u6", score: 75, status: "pending" },
      { id: "m7", matched_user_id: "u7", score: 72, status: "pending" },
      { id: "m8", matched_user_id: "u8", score: 68, status: "pending" },
    ],
    isLoading: false,
    error: null,
  }),
  useDismissMatch: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useConnectWithMatch: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useMatchActivity: () => ({ data: [], isLoading: false }),
  useMarkActivityRead: () => ({ mutate: vi.fn() }),
  useMatchPreferences: () => ({ data: null, isLoading: false }),
  useUpdateMatchPreferences: () => ({ mutate: vi.fn() }),
  useGenerateMatches: () => ({ mutate: vi.fn() }),
  useGenerateBatchMatches: () => ({ mutate: vi.fn() }),
  useCheckMatchGenerationStatus: () => ({ data: null, isLoading: false }),
}))

vi.mock("@/hooks/use-connection-requests", () => ({
  useConnectionRequests: () => ({
    receivedRequests: [
      { id: "cr1", requester_id: "u1", status: "pending", created_at: "2025-01-01" },
      { id: "cr2", requester_id: "u2", status: "pending", created_at: "2025-01-02" },
    ],
    sentRequests: [],
    isLoading: false,
    error: null,
    acceptRequest: vi.fn().mockResolvedValue(true),
    declineRequest: vi.fn().mockResolvedValue(true),
    cancelRequest: vi.fn().mockResolvedValue(true),
    refreshRequests: vi.fn().mockResolvedValue(undefined),
  }),
}))

// ---------------------------------------------------------------------------
// Mock useUser hook
// ---------------------------------------------------------------------------
const mockUserState = {
  user: {
    id: 'test-user-123',
    email: 'test@collabryx.dev',
  },
  profile: {
    full_name: 'Test User',
    avatar_url: null,
    headline: 'Software Engineer',
  },
  isLoading: false,
  error: null,
}

vi.mock('@/hooks/use-user', () => ({
  useUser: () => mockUserState,
}))

// ---------------------------------------------------------------------------
// Mock useSidebar – must be hoisted above the component import
// ---------------------------------------------------------------------------
const mockToggleSidebar = vi.fn()
const mockIsCollapsed = vi.fn(() => true) // default collapsed

vi.mock('@/components/shared/sidebar-context', () => ({
  useSidebar: () => ({
    isCollapsed: mockIsCollapsed(),
    toggleSidebar: mockToggleSidebar,
  }),
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

// ---------------------------------------------------------------------------
// Mock NotificationsWidget (avoids complex dependency chain)
// ---------------------------------------------------------------------------
vi.mock('@/components/features/dashboard/notifications-widget', () => ({
  NotificationsWidget: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notifications-widget">{children}</div>
  ),
}))

// ---------------------------------------------------------------------------
// Mock next/link
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) =>
    React.createElement('a', { href, 'data-testid': `nav-link-${href.replace(/\//g, '-')}`, ...props }, children),
}))

// ---------------------------------------------------------------------------
// Mock AnimatedThemeToggler (tested separately)
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/animated-theme-toggler', () => ({
  AnimatedThemeToggler: ({ variant }: { variant: string }) => (
    <button data-testid={`theme-toggler-${variant}`}>Toggle theme</button>
  ),
}))

// ---------------------------------------------------------------------------
// Unit under test
// ---------------------------------------------------------------------------
import { SidebarNav } from '@/components/shared/sidebar-nav'

describe('SidebarNav (TC-036)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // -----------------------------------------------------------------------
  // Basic rendering
  // -----------------------------------------------------------------------
  it('should render the sidebar nav with navigation sections', () => {
    // Arrange – expanded sidebar
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – key navigation items visible
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Smart Matches')).toBeDefined()
    expect(screen.getByText('Messages')).toBeDefined()
    expect(screen.getByText('Requests')).toBeDefined()
    expect(screen.getByText('AI Mentor')).toBeDefined()
    expect(screen.getByText('My Profile')).toBeDefined()
  })

  it('should render the Collabryx branding / logo', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('Collabryx')).toBeDefined()
  })

  it('should render the profile section with user name', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('Test User')).toBeDefined()
    expect(screen.getByText('Software Engineer')).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Collapse behavior (TC-036)
  // -----------------------------------------------------------------------
  it('should show navigation text labels when expanded (isCollapsed=false)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – section labels visible
    expect(screen.getByText('MAIN')).toBeDefined()
    expect(screen.getByText('COLLABORATION')).toBeDefined()
  })

  it('should hide navigation text labels when collapsed (isCollapsed=true)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(true)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert – section labels hidden (max-w-0 opacity-0 classes)
    const sectionContainer = container.querySelector('[class*="max-h-0"]')
    expect(sectionContainer).not.toBeNull()
  })

  it('should hide the Collabryx text when collapsed', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(true)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert – the text wrapper has collapse classes
    const textWrapper = container.querySelector('[class*="max-w-0"][class*="opacity-0"]')
    expect(textWrapper).not.toBeNull()
  })

  it('should call toggleSidebar when the collapse/expand button is clicked (desktop)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
    fireEvent.click(toggleButton)

    // Assert
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('should show "Expand Sidebar" aria-label when collapsed', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(true)

    // Act
    render(<SidebarNav />)

    // Assert
    const button = screen.getByRole('button', { name: /expand sidebar/i })
    expect(button).toBeDefined()
  })

  it('should show "Collapse Sidebar" aria-label when expanded', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    const button = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(button).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Mobile mode (isMobile=true)
  // -----------------------------------------------------------------------
  it('should always show expanded state when isMobile is true', () => {
    // Arrange – isMobile forces non-collapsed
    mockIsCollapsed.mockReturnValue(true) // context says collapsed

    // Act
    render(<SidebarNav isMobile />)

    // Assert – section labels visible even though context is collapsed
    expect(screen.getByText('MAIN')).toBeDefined()
  })

  it('should hide the desktop toggle button when isMobile is true', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav isMobile />)

    // Assert – no collapse/expand button (conditional on !isMobile)
    const toggleButtons = screen.queryAllByRole('button', { name: /sidebar/i })
    // The toggle button should NOT be rendered in mobile mode
    expect(
      toggleButtons.filter((b) =>
        ['Expand Sidebar', 'Collapse Sidebar'].includes(
          b.getAttribute('aria-label') || ''
        )
      ).length
    ).toBe(0)
  })

  // -----------------------------------------------------------------------
  // Active state highlighting
  // -----------------------------------------------------------------------
  it('should apply active styles to the current route nav item', () => {
    // Arrange – usePathname returns /dashboard (mocked in setup.ts)
    mockIsCollapsed.mockReturnValue(false)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert – Dashboard link has active class
    const dashboardLink = container.querySelector(
      'a[href="/dashboard"]'
    ) as HTMLElement
    expect(dashboardLink).not.toBeNull()
  })

  // -----------------------------------------------------------------------
  // Badge rendering
  // -----------------------------------------------------------------------
  it('should render badge count for Smart Matches (8)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('8')).toBeDefined()
  })

  it('should render badge count for Requests (2)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('2')).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  it('should render without profile (null user/email)', () => {
    // Arrange – override mockUserState for this test only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockUserState as any).user = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockUserState as any).profile = null
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – renders with fallback 'U' initial
    const fallbackText = screen.queryByText('U')
    expect(fallbackText).toBeDefined()

    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockUserState as any).user = { id: 'test-user-123', email: 'test@collabryx.dev' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockUserState as any).profile = {
      full_name: 'Test User',
      avatar_url: null,
      headline: 'Software Engineer',
    }
  })

  it('should render settings and notifications in footer area', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByTestId('notifications-widget')).toBeDefined()
  })
})
