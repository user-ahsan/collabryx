/**
 * TC-040: Lenis library provides smooth scrolling on long public pages
 *
 * Tests that the SmoothScrollProvider instantiates Lenis with the correct
 * configuration options and cleans up on unmount.  Since the actual Lenis
 * library interacts with the DOM scroll, we mock it entirely and verify:
 *   1. Lenis constructor is called with correct config
 *   2. Lenis.raf is called via requestAnimationFrame
 *  3. Lenis instance is exposed on window.lenis
 *  4. Lenis.destroy() is called on cleanup
 *  5. window.lenis is deleted on cleanup
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Module-level spies — defined before vi.mock so the factory can close over them
// ---------------------------------------------------------------------------
const rafSpy = vi.fn()
const destroySpy = vi.fn()

vi.mock('lenis', () => {
  const MockConstructor = function (this: Record<string, unknown>, config: Record<string, unknown>) {
    this.raf = rafSpy
    this.destroy = destroySpy
    this.config = config
    return this
  }
  return { default: MockConstructor }
})

// ---------------------------------------------------------------------------
// Mock requestAnimationFrame (global)
// ---------------------------------------------------------------------------
let rafCallbacks: Array<(time: number) => void> = []
const originalRAF = global.requestAnimationFrame

beforeEach(() => {
  rafCallbacks = []
  rafSpy.mockClear()
  destroySpy.mockClear()
  global.requestAnimationFrame = vi.fn((cb: (time: number) => void) => {
    const id = rafCallbacks.length + 1
    rafCallbacks.push(cb)
    return id
  })
})

afterEach(() => {
  global.requestAnimationFrame = originalRAF
})

// ---------------------------------------------------------------------------
// Unit under test
// ---------------------------------------------------------------------------
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider'
import lenis from 'lenis'

const MockLenis = vi.mocked(lenis)

describe('Lenis Smooth Scroll (TC-040)', () => {
  beforeEach(() => {
    rafCallbacks = []
    delete (window as Window & { lenis?: unknown }).lenis
  })

  afterEach(() => {
    cleanup()
  })

  // -----------------------------------------------------------------------
  // Lenis instantiation
  // -----------------------------------------------------------------------
  it('should instantiate Lenis with correct config on mount', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    expect(MockLenis).toHaveBeenCalledTimes(1)
    const config = MockLenis.mock.calls[0][0] as Record<string, unknown>
    expect(config).toMatchObject({
      duration: 0.8,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })
    expect(config.easing).toBeInstanceOf(Function)
  })

  it('should call lenis.raf via requestAnimationFrame loop', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    rafCallbacks.forEach((cb) => cb(16.67))

    expect(rafSpy).toHaveBeenCalled()
    expect(rafSpy).toHaveBeenCalledWith(expect.any(Number))
  })

  it('should expose Lenis instance on window.lenis', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    const windowLenis = (window as Window & { lenis?: unknown }).lenis
    expect(windowLenis).toBeDefined()
    expect(windowLenis).toHaveProperty('raf')
    expect(windowLenis).toHaveProperty('destroy')
  })

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------
  it('should destroy Lenis instance on unmount', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    unmount()

    expect(destroySpy).toHaveBeenCalledTimes(1)
  })

  it('should delete window.lenis on unmount', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    expect((window as Window & { lenis?: unknown }).lenis).toBeDefined()

    unmount()

    expect((window as Window & { lenis?: unknown }).lenis).toBeUndefined()
  })

  // -----------------------------------------------------------------------
  // Easing function
  // -----------------------------------------------------------------------
  it('should use an easing function that returns values between 0 and 1', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    const config = MockLenis.mock.calls[0][0] as Record<string, unknown>
    const easing = config.easing as (t: number) => number

    expect(easing(0)).toBe(0)
    expect(easing(1)).toBe(1)
    expect(easing(0.5)).toBeGreaterThanOrEqual(0)
    expect(easing(0.5)).toBeLessThanOrEqual(1)
  })

  // -----------------------------------------------------------------------
  // Children rendering
  // -----------------------------------------------------------------------
  it('should render children correctly', () => {
    const { getByText } = render(
      <SmoothScrollProvider>
        <div>Test Children Content</div>
      </SmoothScrollProvider>
    )

    expect(getByText('Test Children Content')).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  it('should handle multiple mounts/unmounts without errors', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    unmount()
    expect(destroySpy).toHaveBeenCalledTimes(1)

    expect(() => {
      render(
        <SmoothScrollProvider>
          <div>New Content</div>
        </SmoothScrollProvider>
      )
    }).not.toThrow()
  })

  it('should call Lenis constructor only once per mount', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    expect(MockLenis).toHaveBeenCalledTimes(1)
  })

  it('should handle rapid scroll via raf without throwing', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    )

    for (let i = 0; i < 60; i++) {
      rafCallbacks.forEach((cb) => cb(i * 16.67))
    }

    expect(rafSpy).toHaveBeenCalledTimes(60)
  })
})