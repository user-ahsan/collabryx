import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

// Import mockSupabaseClient from mocks.ts so we use the SAME instance
// that tests import when they do: import { mockSupabaseClient } from '@/tests/setup/mocks'
import { mockSupabaseClient } from './mocks'

// Re-export for方便 tests that import from setup
export { mockSupabaseClient }

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: MutationCallback) {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    }
  }
} as any

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    }
  },
  usePathname() {
    return '/mock-path'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    const imgElement = document.createElement('img')
    imgElement.src = src
    imgElement.alt = alt
    Object.assign(imgElement, props)
    return imgElement
  },
}))

// Mock motion/react and framer-motion
// motion is a Proxy in framer-motion, so we need to use a Proxy mock
// IMPORTANT: Return actual function components, not plain objects
const createMotionComponent = (elementType: string) => {
  const MotionComponent = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
    return React.createElement('div', { 'data-motion': elementType, ...props }, children)
  }
  MotionComponent.displayName = `motion.${elementType}`
  return MotionComponent
}

const motionProxy = new Proxy(
  {} as Record<string, ReturnType<typeof createMotionComponent>>,
  {
    get: (_target, prop) => {
      if (prop === 'then' || prop === 'catch') return undefined
      return createMotionComponent(String(prop))
    },
  }
)

vi.mock('motion/react', () => ({
  motion: motionProxy,
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}))

vi.mock('framer-motion', () => ({
  motion: motionProxy,
  MotionConfig: ({ children }: { children?: React.ReactNode }) => children,
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  useAnimation: () => ({ start: vi.fn(), set: vi.fn() }),
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
    custom: vi.fn(),
  },
}))
