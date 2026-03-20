/**
 * Responsive Design Utilities
 * 
 * Helpers for mobile-first responsive design and breakpoint management
 */

/**
 * Breakpoint values in pixels
 * Based on Tailwind CSS default breakpoints
 */
export const BREAKPOINTS = {
  sm: 640,    // Small devices (landscape phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices (large desktops)
  "2xl": 1536, // 2X large devices (very large desktops)
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Common device widths for testing
 */
export const DEVICE_WIDTHS = {
  iphoneSE: 375,
  iphone12: 390,
  iphone12Pro: 390,
  iphone14ProMax: 430,
  ipadMini: 768,
  iPad: 810,
  iPadPro: 1024,
  laptop: 1366,
  desktop: 1920,
} as const

export type Device = keyof typeof DEVICE_WIDTHS

/**
 * Get breakpoint from width
 */
export function getBreakpoint(width: number): Breakpoint | null {
  if (width >= BREAKPOINTS["2xl"]) return "2xl"
  if (width >= BREAKPOINTS.xl) return "xl"
  if (width >= BREAKPOINTS.lg) return "lg"
  if (width >= BREAKPOINTS.md) return "md"
  if (width >= BREAKPOINTS.sm) return "sm"
  return null
}

/**
 * Check if current viewport matches breakpoint
 * (Use in useEffect for client-side checks)
 */
export function isBreakpoint(breakpoint: Breakpoint, viewportWidth: number): boolean {
  return viewportWidth >= BREAKPOINTS[breakpoint]
}

/**
 * Mobile viewport check
 */
export function isMobile(viewportWidth: number): boolean {
  return viewportWidth < BREAKPOINTS.md
}

/**
 * Tablet viewport check
 */
export function isTablet(viewportWidth: number): boolean {
  return viewportWidth >= BREAKPOINTS.md && viewportWidth < BREAKPOINTS.lg
}

/**
 * Desktop viewport check
 */
export function isDesktop(viewportWidth: number): boolean {
  return viewportWidth >= BREAKPOINTS.lg
}

/**
 * Touch target size (WCAG 2.1 AA compliance)
 * Minimum 44x44px for touch targets
 */
export const TOUCH_TARGET = {
  min: 44,      // WCAG minimum
  comfortable: 48, // Better UX
  large: 56,    // Primary actions
} as const

/**
 * Get responsive spacing based on viewport
 */
export function getResponsiveSpacing(
  mobile: number,
  tablet?: number,
  desktop?: number
): string {
  if (tablet === undefined && desktop === undefined) {
    return `${mobile}px`
  }
  
  const tabletValue = tablet ?? mobile
  const desktopValue = desktop ?? tabletValue
  
  return `${mobile}px md:${tabletValue}px lg:${desktopValue}px`
}

/**
 * Responsive font size helper
 * Returns Tailwind class string for responsive typography
 */
export function getResponsiveFontSize(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  if (tablet === undefined && desktop === undefined) {
    return `text-${mobile}`
  }
  
  const tabletValue = tablet ?? mobile
  const desktopValue = desktop ?? tabletValue
  
  return `text-${mobile} md:text-${tabletValue} lg:text-${desktopValue}`
}

/**
 * Container max-width for different breakpoints
 */
export const CONTAINER_WIDTHS = {
  sm: "100%",
  md: "720px",
  lg: "960px",
  xl: "1200px",
  "2xl": "1400px",
} as const

/**
 * Get container class for breakpoint
 */
export function getContainerClass(breakpoint: Breakpoint = "2xl"): string {
  return `max-w-${CONTAINER_WIDTHS[breakpoint].replace("px", "")}`
}

/**
 * Responsive grid columns
 */
export function getGridColumns(
  mobile = 1,
  tablet?: number,
  desktop?: number
): string {
  const tabletCols = tablet ?? mobile
  const desktopCols = desktop ?? tabletCols
  
  return `grid-cols-${mobile} md:grid-cols-${tabletCols} lg:grid-cols-${desktopCols}`
}

/**
 * Responsive gap helper
 */
export function getResponsiveGap(
  mobile: number,
  tablet?: number,
  desktop?: number
): string {
  const tabletGap = tablet ?? mobile
  const desktopGap = desktop ?? tabletGap
  
  return `gap-${mobile} md:gap-${tabletGap} lg:gap-${desktopGap}`
}

/**
 * Hide/show utilities for breakpoints
 */
export const DISPLAY_UTILITIES = {
  hideMobile: "hidden md:block",
  hideTablet: "block md:hidden lg:block",
  hideDesktop: "block lg:hidden",
  showMobile: "block md:hidden",
  showTablet: "hidden md:block lg:hidden",
  showDesktop: "hidden lg:block",
} as const

/**
 * Safe area insets for mobile devices (notch, home indicator)
 */
export const SAFE_AREA = {
  top: "env(safe-area-inset-top)",
  right: "env(safe-area-inset-right)",
  bottom: "env(safe-area-inset-bottom)",
  left: "env(safe-area-inset-left)",
} as const

/**
 * Get padding with safe area insets
 */
export function getSafeAreaPadding(
  sides: Array<"top" | "right" | "bottom" | "left"> = ["top", "bottom"]
): string {
  return sides.map(side => SAFE_AREA[side]).join(" ")
}

/**
 * Viewport height fix for mobile browsers
 * Use dvh (dynamic viewport height) for better mobile support
 */
export const VIEWPORT_HEIGHT = {
  full: "h-dvh",           // Full viewport height
  screen: "min-h-dvh",     // Minimum full viewport height
  content: "h-fit",        // Fit to content
} as const

/**
 * Responsive image sizes attribute generator
 */
export function getImageSizes(
  mobileSize = "100vw",
  tabletSize?: string,
  desktopSize?: string
): string {
  if (tabletSize === undefined && desktopSize === undefined) {
    return mobileSize
  }
  
  const tablet = tabletSize ?? mobileSize
  const desktop = desktopSize ?? tablet
  
  return `(max-width: 767px) ${mobileSize}, (max-width: 1023px) ${tablet}, ${desktop}`
}

/**
 * Responsive aspect ratios
 */
export const ASPECT_RATIOS = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  cinematic: "aspect-[21/9]",
} as const

export type AspectRatio = keyof typeof ASPECT_RATIOS

/**
 * Get aspect ratio class
 */
export function getAspectRatio(ratio: AspectRatio): string {
  return ASPECT_RATIOS[ratio]
}

/**
 * Responsive overflow handling
 */
export const OVERFLOW_UTILITIES = {
  mobile: "overflow-x-auto overflow-y-visible",
  desktop: "overflow-visible",
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Responsive hover detection
 */
export function hasHover(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(hover: hover)").matches
}

/**
 * Get responsive classes based on hover support
 */
export function getHoverClasses(
  hoverClass: string,
  fallbackClass: string
): string {
  return hasHover() ? hoverClass : fallbackClass
}
