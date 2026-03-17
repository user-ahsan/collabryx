/**
 * Collabryx Spacing System - 4-Point Grid
 * 
 * All spacing values must be multiples of 4px for visual consistency.
 * Use these constants instead of arbitrary Tailwind values.
 * 
 * Usage:
 * import { SPACING } from '@/lib/constants/spacing'
 * 
 * Then in components:
 * className={`p-${SPACING.SM} gap-${SPACING.MD}`}
 * 
 * Or reference the Tailwind equivalents:
 * 4px = 1 (0.25rem)
 * 8px = 2 (0.5rem)
 * 12px = 3 (0.75rem)
 * 16px = 4 (1rem)
 * etc.
 */

export const SPACING = {
  // Base units (4px grid)
  0: 0,      // 0
  1: 4,      // 0.25rem (4px)
  2: 8,      // 0.5rem (8px)
  3: 12,     // 0.75rem (12px)
  4: 16,     // 1rem (16px)
  5: 20,     // 1.25rem (20px)
  6: 24,     // 1.5rem (24px)
  7: 28,     // 1.75rem (28px)
  8: 32,     // 2rem (32px)
  9: 36,     // 2.25rem (36px)
  10: 40,    // 2.5rem (40px)
  11: 44,    // 2.75rem (44px)
  12: 48,    // 3rem (48px)
  14: 56,    // 3.5rem (56px)
  16: 64,    // 4rem (64px)
  20: 80,    // 5rem (80px)
  24: 96,    // 6rem (96px)
  28: 112,   // 7rem (112px)
  32: 128,   // 8rem (128px)
  36: 144,   // 9rem (144px)
  40: 160,   // 10rem (160px)
} as const

/**
 * Spacing presets for common use cases
 * Use these for consistency across components
 */
export const SPACING_PRESETS = {
  // Component padding
  CARD_PADDING: {
    MOBILE: 'p-4',      // 16px
    TABLET: 'sm:p-6',   // 24px
    DESKTOP: 'lg:p-8',  // 32px
  },
  
  // Gap between elements
  ELEMENT_GAP: {
    TIGHT: 'gap-2',     // 8px
    DEFAULT: 'gap-3',   // 12px
    COMFORTABLE: 'gap-4', // 16px
    RELAXED: 'gap-6',   // 24px
  },
  
  // Section spacing
  SECTION_PADDING: {
    MOBILE: 'py-6',     // 24px
    TABLET: 'md:py-8',  // 32px
    DESKTOP: 'lg:py-12', // 48px
  },
  
  // Container padding
  CONTAINER_PADDING: {
    MOBILE: 'px-4',     // 16px
    TABLET: 'sm:px-6',  // 24px
    DESKTOP: 'lg:px-8', // 32px
  },
} as const

/**
 * Spacing validation helper
 * Ensures spacing values follow 4-point grid
 */
export function isValidSpacing(value: number): boolean {
  return value % 4 === 0 || value === 0
}

/**
 * Get Tailwind spacing class from pixel value
 */
export function getSpacingClass(pixels: number): string {
  const rem = pixels / 16
  const tailwindMap: Record<number, string> = {
    0: '0',
    0.25: '1',
    0.5: '2',
    0.75: '3',
    1: '4',
    1.25: '5',
    1.5: '6',
    1.75: '7',
    2: '8',
    2.5: '10',
    3: '12',
    3.5: '14',
    4: '16',
    5: '20',
    6: '24',
    7: '28',
    8: '32',
    9: '36',
    10: '40',
  }
  return tailwindMap[rem] || '4' // Default to 16px
}
