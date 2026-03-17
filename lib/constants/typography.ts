/**
 * Collabryx Typography System
 * 
 * Based on Clash Display (headings) and Inter (body)
 * All headings use tightened letter-spacing (-2% to -3%)
 * All headings use reduced line-height (110-120%)
 * 
 * Usage:
 * import { TYPOGRAPHY } from '@/lib/constants/typography'
 * 
 * Then in components:
 * <h1 className={TYPOGRAPHY.H1}>Heading</h1>
 */

export const TYPOGRAPHY = {
  /**
   * Font Families
   */
  FONT_FAMILY: {
    HEADING: 'font-heading', // Clash Display
    BODY: 'font-sans',       // Inter
    METRICS: 'font-metrics', // Space Grotesk
    MONO: 'font-mono',       // Geist Mono
  },

  /**
   * Font Sizes (Desktop First)
   * Use with responsive prefixes: text-base md:text-lg
   */
  FONT_SIZE: {
    XS: 'text-xs',        // 12px (0.75rem)
    SM: 'text-sm',        // 14px (0.875rem)
    BASE: 'text-base',    // 16px (1rem)
    LG: 'text-lg',        // 18px (1.125rem)
    XL: 'text-xl',        // 20px (1.25rem)
    '2XL': 'text-2xl',    // 24px (1.5rem)
    '3XL': 'text-3xl',    // 30px (1.875rem)
    '4XL': 'text-4xl',    // 36px (2.25rem)
    '5XL': 'text-5xl',    // 48px (3rem)
    '6XL': 'text-6xl',    // 60px (3.75rem)
    '7XL': 'text-7xl',    // 72px (4.5rem)
  },

  /**
   * Line Heights
   * Tight for headings, normal for body text
   */
  LINE_HEIGHT: {
    TIGHT: 'leading-tight',     // 1.25 (Headings)
    SNUG: 'leading-snug',       // 1.375 (Lead text)
    NORMAL: 'leading-normal',   // 1.5 (Body text)
    RELAXED: 'leading-relaxed', // 1.625 (Prose)
    LOOSE: 'leading-loose',     // 2 (Large text)
  },

  /**
   * Letter Spacing
   * Negative for headings, normal for body
   */
  LETTER_SPACING: {
    TIGHTER: 'tracking-tighter', // -0.05em
    TIGHT: 'tracking-tight',     // -0.025em (Headings)
    NORMAL: 'tracking-normal',   // 0 (Body)
    WIDE: 'tracking-wide',       // 0.025em (Uppercase labels)
    WIDER: 'tracking-wider',     // 0.05em
    WIDEST: 'tracking-widest',   // 0.1em
  },

  /**
   * Font Weights
   */
  FONT_WEIGHT: {
    LIGHT: 'font-light',     // 300
    NORMAL: 'font-normal',   // 400
    MEDIUM: 'font-medium',   // 500
    SEMIBOLD: 'font-semibold', // 600
    BOLD: 'font-bold',       // 700
    EXTRABOLD: 'font-extrabold', // 800
  },

  /**
   * Heading Presets
   * All with tightened letter-spacing and reduced line-height
   */
  H1: 'font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight',
  H2: 'font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight',
  H3: 'font-heading text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight',
  H4: 'font-heading text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight',
  H5: 'font-heading text-lg md:text-xl lg:text-2xl font-semibold tracking-tight leading-snug',
  H6: 'font-heading text-base md:text-lg lg:text-xl font-semibold tracking-tight leading-snug',

  /**
   * Body Text Presets
   */
  BODY_XS: 'font-sans text-xs leading-normal tracking-normal',
  BODY_SM: 'font-sans text-sm leading-normal tracking-normal',
  BODY_BASE: 'font-sans text-base leading-normal tracking-normal',
  BODY_LG: 'font-sans text-lg leading-relaxed tracking-normal',
  BODY_XL: 'font-sans text-xl leading-relaxed tracking-normal',

  /**
   * UI Text Presets
   */
  UI_LABEL: 'font-sans text-xs font-semibold tracking-wide uppercase',
  UI_BUTTON: 'font-sans text-sm font-medium tracking-normal',
  UI_CAPTION: 'font-sans text-xs leading-normal tracking-normal',
  UI_OVERLINE: 'font-sans text-xs font-semibold tracking-wider uppercase',

  /**
   * Special Text Styles
   */
  DISPLAY: 'font-heading text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none',
  LEAD: 'font-sans text-lg md:text-xl lg:text-2xl leading-snug tracking-normal',
  PROSE: 'font-sans text-base leading-relaxed tracking-normal',
} as const

/**
 * Responsive typography helper
 * Generates responsive class string
 */
export function responsiveText(base: string, md: string, lg: string): string {
  return `${base} md:${md} lg:${lg}`
}

/**
 * Get heading class by level
 */
export function getHeadingClass(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  const key = `H${level}` as keyof typeof TYPOGRAPHY
  return TYPOGRAPHY[key] as string
}

/**
 * Validate font size follows system
 */
export function isValidFontSize(size: string): boolean {
  const validSizes = Object.values(TYPOGRAPHY.FONT_SIZE) as string[]
  return validSizes.includes(size)
}
