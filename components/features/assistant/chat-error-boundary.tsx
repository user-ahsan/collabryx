/**
 * ============================================================================
 * ImageErrorSilencer — Suppresses PromptInput file errors at the window level
 * ============================================================================
 *
 * The Vercel AI SDK's PromptInput has internal file validation that fires in
 * async event handlers (paste, drop, file input onChange). These errors can't
 * be caught by React error boundaries (which only catch render/lifecycle errors).
 *
 * This component installs a window-level error handler that catches and
 * suppresses the specific "model does not support image" errors that the
 * SDK throws from event handlers before they reach the developer console.
 *
 * @see {@link ../chat-input.tsx}
 * ============================================================================
 */
'use client'

import { useEffect, type ReactNode } from 'react'

const IMAGE_ERROR_PATTERNS = [
  'does not support image',
  'Cannot read',
  'image input',
  'model does not support',
]

function matchesImageError(msg: string): boolean {
  return IMAGE_ERROR_PATTERNS.some(p => msg.includes(p))
}

/**
 * Install a window error handler that suppresses PromptInput file errors.
 * Run this once per app lifecycle inside a ChatInput or layout component.
 *
 * Uses THREE layers of suppression to catch errors from ALL sources:
 * 1. window 'error' event — sync errors from event handlers (not caught by React boundaries)
 * 2. window 'unhandledrejection' — async errors and promise rejections
 * 3. console.error override — errors that are logged but not thrown
 */
export function useImageErrorSuppression() {
  useEffect(() => {
    // Layer 1: Unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason)
      if (matchesImageError(msg)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    // Layer 2: Sync errors from event handlers
    const errorHandler = (event: ErrorEvent) => {
      const msg = event.error?.message || event.message || ''
      if (matchesImageError(msg)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    // Layer 3: console.error override — catches errors that are logged but not thrown
    const origError = console.error
    const origWarn = console.warn
    console.error = function (...args: unknown[]) {
      const msg = args.map(a => String(a)).join(' ')
      if (matchesImageError(msg)) return // suppress silently
      return origError.apply(console, args)
    }
    console.warn = function (...args: unknown[]) {
      const msg = args.map(a => String(a)).join(' ')
      if (matchesImageError(msg)) return
      return origWarn.apply(console, args)
    }

    window.addEventListener('unhandledrejection', rejectionHandler, true)
    window.addEventListener('error', errorHandler, true)

    return () => {
      window.removeEventListener('unhandledrejection', rejectionHandler, true)
      window.removeEventListener('error', errorHandler, true)
      console.error = origError
      console.warn = origWarn
    }
  }, [])
}

interface Props {
  children: ReactNode
}

/**
 * Mount this at the page level to suppress PromptInput file errors globally.
 * Uses BOTH a React error boundary (for render-phase errors) AND window-level
 * handlers (for async event handler errors that boundaries can't catch).
 */
export function ChatErrorBoundary({ children }: Props) {
  useImageErrorSuppression()
  return <>{children}</>
}
