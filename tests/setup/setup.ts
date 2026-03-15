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
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    const imgElement = document.createElement('img')
    imgElement.src = src
    imgElement.alt = alt
    Object.assign(imgElement, props)
    return imgElement
  },
}))

// Mock motion/framer-motion
interface MotionComponentProps {
  children?: React.ReactNode
  [key: string]: unknown
}

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: MotionComponentProps) => ({ type: 'div', props, children }),
    button: ({ children, ...props }: MotionComponentProps) => ({ type: 'button', props, children }),
    span: ({ children, ...props }: MotionComponentProps) => ({ type: 'span', props, children }),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}))
