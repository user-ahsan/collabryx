import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

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
  default: ({ src, alt, ...props }: any) => {
    const imgElement = document.createElement('img')
    imgElement.src = src
    imgElement.alt = alt
    Object.assign(imgElement, props)
    return imgElement
  },
}))

// Mock motion/framer-motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => ({ type: 'div', props, children }),
    button: ({ children, ...props }: any) => ({ type: 'button', props, children }),
    span: ({ children, ...props }: any) => ({ type: 'span', props, children }),
  },
  AnimatePresence: ({ children }: any) => children,
}))
