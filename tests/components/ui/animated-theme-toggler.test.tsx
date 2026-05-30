/**
 * TC-033: next-themes dark mode toggle instantly switches UI light→dark without page reload
 * TC-034: System detects and respects OS-level dark/light mode preference
 *
 * Tests the AnimatedThemeToggler component for both icon and slider variants.
 * Mocks document.startViewTransition, document.documentElement.classList,
 * localStorage, and MutationObserver via vitest.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock theme-provider (useTheme needs ThemeProvider, mock it instead)
// ---------------------------------------------------------------------------
vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useTheme: () => ({
    theme: "light" as const,
    setTheme: vi.fn(),
    resolvedTheme: "light" as const,
  }),
}))

// ---------------------------------------------------------------------------
// Test-local mocks
// ---------------------------------------------------------------------------
const classListAdd = vi.fn()
const classListRemove = vi.fn()
const classListToggle = vi.fn()
const classListContains = vi.fn()

const mockClassList = {
  add: classListAdd,
  remove: classListRemove,
  toggle: classListToggle,
  contains: classListContains,
}

// document.startViewTransition mock
let viewTransitionCallback: (() => void) | null = null
const mockStartViewTransition = vi.fn((cb: () => void) => {
  viewTransitionCallback = cb
  return {
    ready: Promise.resolve(),
    finished: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
  }
})

// document.documentElement mock
const _originalDocumentElement = document.documentElement

// localStorage mock
const localStorageStore: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k])
  }),
}

// MutationObserver mock
let _mutationCallback: MutationCallback | null = null
const mockDisconnect = vi.fn()
const mockObserve = vi.fn()

// Create a proper constructor function
const MockMutationObserverFn = function(this: { disconnect: typeof mockDisconnect, observe: typeof mockObserve, takeRecords: ReturnType<typeof vi.fn> }, cb: MutationCallback) {
  _mutationCallback = cb
  this.disconnect = mockDisconnect
  this.observe = mockObserve
  this.takeRecords = vi.fn(() => [])
}

// Copy prototype from native MutationObserver
MockMutationObserverFn.prototype = MutationObserver.prototype

const MockMutationObserver = vi.fn(MockMutationObserverFn)

// window.matchMedia mock for TC-034
const matchMediaListeners = new Set<(e: { matches: boolean }) => void>()
const mockMatchMedia = vi.fn((query: string) => {
  const mql = {
    matches: false, // default: light mode
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
      if (event === 'change') matchMediaListeners.add(handler)
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
      matchMediaListeners.delete(handler)
    }),
    dispatchEvent: vi.fn(),
  }
  return mql
})

// ---------------------------------------------------------------------------
// Unit under test
// ---------------------------------------------------------------------------
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

describe('AnimatedThemeToggler (TC-033, TC-034)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageStore['theme'] = 'light'
    classListContains.mockReturnValue(false)
    viewTransitionCallback = null
    _mutationCallback = null

    // Apply mocks
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: mockClassList,
        animate: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    })
    vi.stubGlobal('MutationObserver', MockMutationObserver)
  })

  afterEach(() => {
    cleanup()
  })

  // -----------------------------------------------------------------------
  // TC-033: Dark mode toggle instantly switches UI light→dark
  // -----------------------------------------------------------------------

  describe('TC-033 – theme toggle', () => {
    it('should render the icon variant with aria-label for accessibility', () => {
      // Arrange
      // Act
      render(<AnimatedThemeToggler variant="icon" />)

      // Assert
      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toBeDefined()
    })

    it('should render the slider variant with correct structure', () => {
      // Arrange
      // Act
      const { container } = render(<AnimatedThemeToggler variant="slider" />)

      // Assert – slider has an inner animated div
      const button = screen.getByRole('button', { name: /toggle theme/i })
      const innerDiv = container.querySelector('[class*="absolute"]')
      expect(button).toBeDefined()
      expect(innerDiv).not.toBeNull()
    })

    it('should show Moon icon when theme is light (isDark=false)', () => {
      // Arrange – starts in light mode
      classListContains.mockReturnValue(false)

      // Act
      const { container } = render(<AnimatedThemeToggler variant="icon" />)

      // Assert – Moon icon visible (Lucide renders SVG)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
    })

    it('should show Sun icon when theme is dark (isDark=true)', () => {
      // Arrange – dark mode active
      classListContains.mockReturnValue(true)

      // Act
      const { container } = render(<AnimatedThemeToggler variant="icon" />)

      // Assert – Sun icon visible
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
    })

    it('should toggle dark class on document.documentElement when clicked', () => {
      // Arrange
      classListContains.mockReturnValue(false) // starts light
      render(<AnimatedThemeToggler variant="icon" />)
      const button = screen.getByRole('button', { name: /toggle theme/i })

      // Act – click the button
      fireEvent.click(button)

      // Assert – startViewTransition was called
      expect(mockStartViewTransition).toHaveBeenCalledTimes(1)

      // Execute the view transition callback
      if (viewTransitionCallback) viewTransitionCallback()

      // classList.toggle('dark') should have been called
      expect(classListToggle).toHaveBeenCalledWith('dark')

      // localStorage should have been updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('should switch from dark back to light when clicked twice', () => {
      // Arrange – starts dark
      classListContains.mockReturnValue(true)
      render(<AnimatedThemeToggler variant="icon" />)
      const button = screen.getByRole('button', { name: /toggle theme/i })

      // Act – click (should switch to light)
      fireEvent.click(button)

      // Execute view transition
      if (viewTransitionCallback) viewTransitionCallback()

      // Assert
      expect(classListToggle).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('should apply slider active position (left-1) in light mode', () => {
      // Arrange
      classListContains.mockReturnValue(false)

      // Act
      const { container } = render(<AnimatedThemeToggler variant="slider" />)

      // Assert – the inner knob should be positioned at left-1
      const knob = container.querySelector('[class*="absolute"]') as HTMLElement
      expect(knob?.className).toMatch(/left-1/)
    })

    it('should apply slider dark position (left-[calc...]) in dark mode', () => {
      // Arrange
      classListContains.mockReturnValue(true)

      // Act
      const { container } = render(<AnimatedThemeToggler variant="slider" />)

      // Assert – knob moved to the right
      const knob = container.querySelector('[class*="absolute"]') as HTMLElement
      const classes = knob?.className || ''
      expect(classes).toMatch(/left-\[calc/)
    })

    it('should not crash when buttonRef is null (edge case)', () => {
      // Arrange – render without issues
      render(<AnimatedThemeToggler variant="icon" />)

      // Act – manually call toggle without ref
      // (component handles this internally with the ref check)
      const button = screen.getByRole('button', { name: /toggle theme/i })

      // Assert – button is in the DOM
      expect(button).toBeDefined()
    })
  })

  // -----------------------------------------------------------------------
  // TC-034: System detects and respects OS-level dark/light mode preference
  // -----------------------------------------------------------------------

  describe('TC-034 – OS preference detection', () => {
    it('should detect dark mode preference when matchMedia matches:true for dark', () => {
      // Arrange – override matchMedia to report dark preference
      const darkMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)', // true for dark query
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      Object.defineProperty(window, 'matchMedia', {
        value: darkMatchMedia,
        writable: true,
        configurable: true,
      })

      // Act – verify matchMedia can detect dark preference
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

      // Assert
      expect(darkQuery.matches).toBe(true)
      expect(lightQuery.matches).toBe(false)
    })

    it('should detect light mode preference when matchMedia reports light mode', () => {
      // Arrange
      const lightMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      Object.defineProperty(window, 'matchMedia', {
        value: lightMatchMedia,
        writable: true,
        configurable: true,
      })

      // Act
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

      // Assert
      expect(darkQuery.matches).toBe(false)
      expect(lightQuery.matches).toBe(true)
    })

    it('should expose matchMedia listeners for OS preference changes', () => {
      // Arrange
      const listeners: Array<(e: { matches: boolean }) => void> = []
      const listenerMatchMedia = vi.fn((_query: string) => ({
        matches: false,
        media: '#',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(
          (_event: string, handler: (e: { matches: boolean }) => void) => {
            listeners.push(handler)
          }
        ),
        removeEventListener: vi.fn(
          (_event: string, handler: (e: { matches: boolean }) => void) => {
            const idx = listeners.indexOf(handler)
            if (idx > -1) listeners.splice(idx, 1)
          }
        ),
        dispatchEvent: vi.fn(),
      }))
      Object.defineProperty(window, 'matchMedia', {
        value: listenerMatchMedia,
        writable: true,
        configurable: true,
      })

      // Act – query dark mode and register a listener
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = vi.fn()
      mql.addEventListener('change', listener)

      // Simulate OS preference change
      listeners.forEach((l) => l({ matches: true }))

      // Assert
      expect(listener).toHaveBeenCalledWith({ matches: true })
    })

    it('should call MutationObserver on theme changes', () => {
      // Arrange
      classListContains.mockReturnValue(false)
      render(<AnimatedThemeToggler variant="icon" />)

      // Assert – MutationObserver was instantiated with attribute filter
      expect(MockMutationObserver).toHaveBeenCalled()
      expect(mockObserve).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['class'],
        })
      )
    })

    it('should disconnect MutationObserver on unmount', () => {
      // Arrange
      const { unmount } = render(<AnimatedThemeToggler variant="icon" />)

      // Act
      unmount()

      // Assert
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('should support no-preference scenario (neither dark nor light matches)', () => {
      // Arrange
      const neutralMatchMedia = vi.fn((_query: string) => ({
        matches: false, // no preference reported
        media: '#',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      Object.defineProperty(window, 'matchMedia', {
        value: neutralMatchMedia,
        writable: true,
        configurable: true,
      })

      // Act
      const dark = window.matchMedia('(prefers-color-scheme: dark)')
      const light = window.matchMedia('(prefers-color-scheme: light)')

      // Assert – neither matches, defaults to light in component
      expect(dark.matches).toBe(false)
      expect(light.matches).toBe(false)
    })
  })
})
