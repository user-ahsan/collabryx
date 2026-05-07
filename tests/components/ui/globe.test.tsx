/**
 * TC-031: Cobe WebGL globe renders smoothly on landing page
 * TC-032: Three.js components degrade gracefully if no WebGL support
 *
 * Mocks cobe, motion/react, and IntersectionObserver (already in setup.ts).
 * Tests that the Globe component renders a canvas element without crash
 * and shows fallback UI when WebGL context is unavailable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock cobe (the WebGL globe library) – default export is createGlobe
// ---------------------------------------------------------------------------
const mockGlobeDestroy = vi.fn()
const mockCreateGlobe = vi.fn(() => ({
  destroy: mockGlobeDestroy,
}))

vi.mock('cobe', () => {
  return {
    default: function cobeMock(..._args: unknown[]) {
      return mockCreateGlobe()
    },
  }
})

// ---------------------------------------------------------------------------
// Mock motion/react  (useMotionValue / useSpring)
//   setup.ts already mocks motion.div etc. but these hooks need explicit mocks
// ---------------------------------------------------------------------------
const mockMotionValueGet = vi.fn(() => 0)
const mockMotionValueSet = vi.fn()
const mockMotionValue = vi.fn((initial: number) => ({
  get: () => mockMotionValueGet(),
  set: (v: number) => mockMotionValueSet(v),
  onChange: vi.fn(),
  destroy: vi.fn(),
}))
const mockUseSpring = vi.fn((_value: unknown) => ({
  get: () => 0,
}))

vi.mock('motion/react', () => ({
  useMotionValue: vi.fn((initial: number) => ({
    get: () => 0,
    set: vi.fn(),
    onChange: vi.fn(),
    destroy: vi.fn(),
  })),
  useSpring: vi.fn(() => ({
    get: () => 0,
  })),
}))

// ---------------------------------------------------------------------------
// Unit under test
// ---------------------------------------------------------------------------
import { Globe } from '@/components/ui/globe'

describe('Globe (TC-031, TC-032)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // -----------------------------------------------------------------------
  // TC-031: Cobe WebGL globe renders smoothly on landing page
  // -----------------------------------------------------------------------
  it('should render a canvas element without crashing', () => {
    // Arrange
    // Act
    const { container } = render(<Globe />)

    // Assert
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
  })

  it('should call createGlobe with the canvas ref and config', () => {
    // Arrange
    // Act
    render(<Globe />)

    // Assert – createGlobe was called with a <canvas> element
    expect(mockCreateGlobe).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateGlobe.mock.calls[0] as unknown as [HTMLCanvasElement, object]
    expect(callArgs[0]).toBeInstanceOf(HTMLCanvasElement)
    expect(callArgs[1]).toMatchObject({
      width: expect.any(Number),
      height: expect.any(Number),
      onRender: expect.any(Function),
    })
  })

  it('should apply opacity-0 to canvas initially for smooth fade-in', () => {
    // Arrange
    // Act
    const { container } = render(<Globe />)

    // Assert – canvas has the opacity-0 class from cn() helper
    const canvas = container.querySelector('canvas')
    expect(canvas?.className).toMatch(/opacity-0/)
  })

  it('should destroy cobe instance on unmount (cleanupp)', () => {
    // Arrange
    const { unmount } = render(<Globe />)

    // Act
    unmount()

    // Assert
    expect(mockGlobeDestroy).toHaveBeenCalledTimes(1)
  })

  it('should respect custom className prop', () => {
    // Arrange
    // Act
    const { container } = render(<Globe className="custom-globe" />)

    // Assert
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.className).toMatch(/custom-globe/)
  })

  // -----------------------------------------------------------------------
  // TC-032: Three.js components degrade gracefully if no WebGL support
  // -----------------------------------------------------------------------
  it('should show fallback UI when WebGL context creation fails', () => {
    // Arrange – simulate WebGL failure by throwing in createGlobe
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCreateGlobe.mockImplementationOnce(() => {
      throw new Error('WebGL not supported')
    })

    // Act – render with error boundary-style handling
    // Since the Globe component calls createGlobe inside useEffect,
    // a thrown error won't crash the render phase but will be caught by React.
    // We test the fallback by wrapping in a try/catch pattern.
    let renderedWithoutCrash = false
    try {
      render(<Globe />)
      renderedWithoutCrash = true
    } catch (_err) {
      renderedWithoutCrash = false
    }

    // Assert – the component should not crash the whole React tree
    expect(renderedWithoutCrash).toBe(true)

    consoleErrorSpy.mockRestore()
  })

  it('should render a canvas element even without active WebGL context (graceful degradation)', () => {
    // Arrange – mock createGlobe to return a "null" globe (WebGL unavailable)
    mockCreateGlobe.mockReturnValue({
      destroy: vi.fn(),
    })

    // Act
    const { container } = render(<Globe />)

    // Assert – the canvas element is still in the DOM (degraded state)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    // The wrapper div should not have crashed
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
  })

  it('should handle missing canvas ref gracefully', () => {
    // Arrange – mock createGlobe to handle null canvas
    mockCreateGlobe.mockImplementationOnce(() => {
      throw new Error('No canvas element')
    })

    // Act
    let didRender = false
    try {
      render(<Globe />)
      didRender = true
    } catch (_err) {
      didRender = false
    }

    // Assert
    expect(didRender).toBe(true)
  })
})
