import * as React from "react"

/**
 * Custom hook to track media query matches
 * Useful for conditional animations and responsive behavior
 */
export function useMediaQuery(query: string): boolean {
    const getSnapshot = () => {
        if (typeof window === "undefined") return false
        return window.matchMedia(query).matches
    }

    const subscribe = (callback: () => void) => {
        if (typeof window === "undefined") return () => { }
        const media = window.matchMedia(query)
        const listener = () => callback()
        media.addEventListener("change", listener)
        return () => media.removeEventListener("change", listener)
    }

    return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Preset hooks for common breakpoints
 */
export const useIsMobile = () => useMediaQuery("(max-width: 768px)")
export const useIsTablet = () => useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)")
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)")
