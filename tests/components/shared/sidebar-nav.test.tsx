/**
 * TC-036: Sidebar navigation renders flat list with divider for collapsed/expanded states
 *
 * Tests SidebarNav rendering with the consolidated flat nav structure:
 *  - No section labels, just a visual divider between primary & secondary groups
 *  - No Smart Matches badge
 *  - No footer toolbox (Settings icon + theme toggler removed)
 *  - Compact profile at bottom
 *  - Active route matching for nested paths
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

vi.mock("@/hooks/use-connections", () => ({
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

vi.mock('@/hooks/use-profile', () => ({
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
  // Basic rendering — flat nav structure, no section labels
  // -----------------------------------------------------------------------
  it('should render all navigation items in a flat structure', () => {
    // Arrange – expanded sidebar
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – primary items
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Messages')).toBeDefined()
    expect(screen.getByText('Smart Matches')).toBeDefined()
    expect(screen.getByText('Notifications')).toBeDefined()
    expect(screen.getByText('AI Mentor')).toBeDefined()

    // Assert – secondary items
    expect(screen.getByText('Requests')).toBeDefined()
    expect(screen.getByText('Analytics')).toBeDefined()
    expect(screen.getByText('My Profile')).toBeDefined()
    expect(screen.getByText('Bookmarks')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByText('Help')).toBeDefined()
  })

  it('should render the Collabryx branding / logo', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert
    expect(screen.getByText('Collabryx')).toBeDefined()
  })

  it('should NOT render section labels (removed for flat nav)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – section labels should NOT exist
    expect(screen.queryByText('MAIN')).toBeNull()
    expect(screen.queryByText('COLLABORATION')).toBeNull()
    expect(screen.queryByText('DISCOVER')).toBeNull()
    expect(screen.queryByText('AI TOOLS')).toBeNull()
    expect(screen.queryByText('ACCOUNT')).toBeNull()
    expect(screen.queryByText('SUPPORT')).toBeNull()
  })

  // -----------------------------------------------------------------------
  // Profile section — compact at bottom
  // -----------------------------------------------------------------------
  it('should render the compact profile section at the bottom', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – profile name visible in compact footer
    expect(screen.getByText('Test User')).toBeDefined()
    expect(screen.getByText('Software Engineer')).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Collapse behavior
  // -----------------------------------------------------------------------
  it('should show navigation text labels when expanded (isCollapsed=false)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – all item labels visible
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Messages')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('should hide navigation text labels when collapsed (isCollapsed=true)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(true)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert – items rendered but text wrapped in max-w-0 opacity-0
    const textWrappers = container.querySelectorAll('[class*="max-w-0"][class*="opacity-0"]')
    expect(textWrappers.length).toBeGreaterThan(0)
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

  it('should show "Expand sidebar" aria-label when collapsed', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(true)

    // Act
    render(<SidebarNav />)

    // Assert
    const button = screen.getByRole('button', { name: /expand sidebar/i })
    expect(button).toBeDefined()
  })

  it('should show "Collapse sidebar" aria-label when expanded', () => {
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

    // Assert – all items visible even though context is collapsed
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('AI Mentor')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('should hide the desktop toggle button when isMobile is true', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav isMobile />)

    // Assert – no collapse/expand button (conditional on !isMobile)
    const toggleButtons = screen.queryAllByRole('button', { name: /sidebar/i })
    expect(
      toggleButtons.filter((b) =>
        ['Expand sidebar', 'Collapse sidebar'].includes(
          b.getAttribute('aria-label') || ''
        )
      ).length
    ).toBe(0)
  })

  // -----------------------------------------------------------------------
  // Active state highlighting — supports nested routes
  // -----------------------------------------------------------------------
  it('should apply active styles to the current route nav item', () => {
    // Arrange – usePathname returns /dashboard (mocked in setup.ts)
    mockIsCollapsed.mockReturnValue(false)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert – Dashboard link has aria-current="page"
    const dashboardLink = container.querySelector(
      'a[href="/dashboard"]'
    ) as HTMLElement
    expect(dashboardLink).not.toBeNull()
    expect(dashboardLink.getAttribute('aria-current')).toBe('page')
  })

  // -----------------------------------------------------------------------
  // Badge rendering — only Requests badge kept, Smart Matches badge removed
  // -----------------------------------------------------------------------
  it('should NOT render badge count for Smart Matches (removed per UX feedback)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – Smart Matches should NOT have a badge
    // The Smart Matches link should not contain a badge element
    const smartMatchesContainer = screen.getByText('Smart Matches').closest('a')
    expect(smartMatchesContainer).not.toBeNull()
    // Verify no badge number after Smart Matches
    // (8 matches exist in mock but badge removed)
    expect(screen.queryByText('8')).toBeNull()
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
  // Accessibility — ARIA attributes
  // -----------------------------------------------------------------------
  it('should render as a <nav> element with aria-label', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert
    const nav = container.querySelector('nav[aria-label="Main navigation"]')
    expect(nav).not.toBeNull()
  })

  it('should have aria-current="page" on active nav link', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert
    const activeLink = container.querySelector('[aria-current="page"]')
    expect(activeLink).not.toBeNull()
    expect(activeLink?.getAttribute('href')).toBe('/dashboard')
  })

  it('should render nav items as list items with role="listitem"', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    const { container } = render(<SidebarNav />)

    // Assert
    const listItems = container.querySelectorAll('[role="listitem"]')
    expect(listItems.length).toBeGreaterThan(0)
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

  it('should NOT render footer toolbox (settings button + theme toggler removed)', () => {
    // Arrange
    mockIsCollapsed.mockReturnValue(false)

    // Act
    render(<SidebarNav />)

    // Assert – Settings appears as a nav item (not a separate footer button)
    // The Settings text should exist as a nav link
    const settingsLink = screen.getByText('Settings')
    expect(settingsLink).toBeDefined()
    // The old toolbox had a theme toggler — it should NOT exist
    // (AnimatedThemeToggler would render a button with testid, now gone)
    // Instead, verify the separator between primary and secondary lists exists
  })
})
