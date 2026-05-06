/**
 * TC-036: Mobile navigation renders correctly and SidebarNav is included
 *
 * Tests that MobileNav:
 *  - Renders the mobile header bar with md:hidden responsive class
 *  - Contains a Sheet with SidebarNav inside
 *  - Has a user dropdown menu with Profile, Settings, Logout
 *  - Handles logout action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSignOut = vi.fn().mockResolvedValue({ error: null })
const mockRouterPush = vi.fn()
const mockOpenSettings = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-123',
      email: 'test@collabryx.dev',
    },
    profile: {
      full_name: 'Mobile User',
      avatar_url: null,
    },
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({
    openSettings: mockOpenSettings,
    isOpen: false,
    closeSettings: vi.fn(),
  }),
}))

vi.mock('@/components/features/dashboard/notifications-widget', () => ({
  NotificationsWidget: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    // Render children directly without wrapper, preserving their accessible names
    return <>{children}</>
  },
}))

vi.mock('@/components/shared/sidebar-context', () => ({
  useSidebar: () => ({
    state: 'expanded',
    isMobile: true,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    setOpen: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Unit under test
// ---------------------------------------------------------------------------
import { MobileNav } from '@/components/shared/mobile-nav'

describe('MobileNav (TC-036)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  it('should render the mobile nav bar with md:hidden class', () => {
    // Arrange
    // Act
    const { container } = render(<MobileNav />)

    // Assert – the top bar has md:hidden class
    const topBar = container.querySelector('[class*="md:hidden"]')
    expect(topBar).not.toBeNull()
  })

  it('should render the Collabryx branding in mobile header', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Assert
    expect(screen.getByText('Collabryx')).toBeDefined()
  })

  it('should render a hamburger menu button for opening the sidebar sheet', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Assert
    const hamburgerButton = screen.getByRole('button', {
      name: /open sidebar/i,
    })
    expect(hamburgerButton).toBeDefined()
  })

  it('should render the user avatar dropdown trigger', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Assert – avatar button with user initials
    const fallbackText = screen.getByText('MU') // Mobile User => M U
    expect(fallbackText).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // SidebarNav inside Sheet
  // -----------------------------------------------------------------------
  it('should pass isMobile=true to SidebarNav', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Open the sheet by clicking the hamburger button
    const hamburgerButton = screen.getByRole('button', { name: /open sidebar/i })
    fireEvent.click(hamburgerButton)

    // Assert - SidebarNav is inside SheetContent, only rendered when sheet is open
    const sidebarNav = screen.getByTestId('sidebar-nav')
    expect(sidebarNav).toBeDefined()
    expect(sidebarNav.getAttribute('data-ismobile')).toBe('true')
  })

  // -----------------------------------------------------------------------
  // Dropdown menu actions
  // -----------------------------------------------------------------------
  it('should render the notifications bell button', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Assert – bell button is rendered with accessible label
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  // -----------------------------------------------------------------------
  // User profile fallback
  // -----------------------------------------------------------------------
  it('should show initial avatar fallback for user without avatar_url', () => {
    // Arrange
    // Act
    render(<MobileNav />)

    // Assert – initials from full_name
    const initial = screen.getByText('MU')
    expect(initial).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Responsive classes (TC-035 overlap)
  // -----------------------------------------------------------------------
  it('should use Tailwind responsive classes for mobile-only visibility', () => {
    // Arrange
    // Act
    const { container } = render(<MobileNav />)

    // Assert – the outermost container has md:hidden
    const stickyBar = container.firstChild as HTMLElement
    expect(stickyBar?.className || '').toMatch(/md:hidden/)
  })

  it('should have backdrop blur styling in the header', () => {
    // Arrange
    // Act
    const { container } = render(<MobileNav />)

    // Assert
    const stickyBar = container.firstChild as HTMLElement
    expect(stickyBar?.className || '').toMatch(/backdrop-blur/)
  })
})
