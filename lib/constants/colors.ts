/**
 * Collabryx Color System
 * 
 * Brand Colors:
 * - Dark Mode Background: #0A0A0F (Deep Navy-Black) - PRESERVED
 * - Brand Color: oklch(0.488 0.243 264.376) (Purple-Blue)
 * - Glass Effects: Blue-tinted with blue-400/10 borders
 * 
 * Usage:
 * import { COLORS, SEMANTIC_COLORS } from '@/lib/constants/colors'
 */

/**
 * Brand Color Palette
 * These are the core colors that define Collabryx's visual identity
 */
export const BRAND_COLORS = {
  // Core brand color (Purple-Blue)
  BRAND: 'oklch(0.488 0.243 264.376)',
  BRAND_FOREGROUND: 'oklch(0.985 0 0)',
  
  // Dark mode background (PRESERVED - DO NOT CHANGE)
  BACKGROUND_DARK: '#0A0A0F',
  
  // Accent colors for gradients
  PURPLE_500: 'oklch(0.627 0.265 303.9)',
  BLUE_500: 'oklch(0.623 0.214 259.815)',
  CYAN_500: 'oklch(0.715 0.143 215.221)',
} as const

/**
 * Semantic Colors
 * Used for specific purposes across the application
 */
export const SEMANTIC_COLORS = {
  /**
   * Primary Actions
   * Trust actions: Connect, Save, Confirm
   */
  PRIMARY: {
    DEFAULT: 'text-primary',
    BG: 'bg-primary',
    HOVER: 'hover:bg-primary/90',
    BORDER: 'border-primary',
  },

  /**
   * Destructive Actions
   * Danger actions: Delete, Remove, Cancel
   */
  DESTRUCTIVE: {
    DEFAULT: 'text-destructive',
    BG: 'bg-destructive',
    HOVER: 'hover:bg-destructive/90',
    BORDER: 'border-destructive',
  },

  /**
   * Success States
   * Completed states, positive feedback
   */
  SUCCESS: {
    TEXT: 'text-green-500',
    BG: 'bg-green-500/10',
    BORDER: 'border-green-500/20',
    DARK_TEXT: 'dark:text-green-400',
  },

  /**
   * Warning States
   * Caution states, pending actions
   */
  WARNING: {
    TEXT: 'text-yellow-500',
    BG: 'bg-yellow-500/10',
    BORDER: 'border-yellow-500/20',
    DARK_TEXT: 'dark:text-yellow-400',
  },

  /**
   * Error States
   * Failed actions, validation errors
   */
  ERROR: {
    TEXT: 'text-red-500',
    BG: 'bg-red-500/10',
    BORDER: 'border-red-500/20',
    DARK_TEXT: 'dark:text-red-400',
  },

  /**
   * Info States
   * Informational messages, help text
   */
  INFO: {
    TEXT: 'text-blue-500',
    BG: 'bg-blue-500/10',
    BORDER: 'border-blue-500/20',
    DARK_TEXT: 'dark:text-blue-400',
  },
} as const

/**
 * Glass Effect Colors
 * Consistent glass tints across all components
 */
export const GLASS_COLORS = {
  /**
   * Card Glass (Tier 1)
   * For: Post cards, Match cards, Profile cards
   */
  CARD: {
    BG: 'bg-blue-950/[0.05]',
    BACKDROP: 'backdrop-blur-2xl',
    BORDER: 'border-blue-400/10',
    SHADOW: 'shadow-[0_4px_32px_0_rgba(59,130,246,0.06)]',
    INNER_SHADOW: 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
  },

  /**
   * Overlay Glass (Tier 2)
   * For: Dialogs, Modals, Popovers
   */
  OVERLAY: {
    BG: 'bg-card/95',
    BACKDROP: 'backdrop-blur-2xl',
    BORDER: 'border-blue-500/20',
    SHADOW: 'shadow-[0_8px_40px_0_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(59,130,246,0.1)]',
  },

  /**
   * Input Glass (Tier 3)
   * For: Input fields, Textareas
   */
  INPUT: {
    BG: 'bg-background/40',
    BACKDROP: 'backdrop-blur-md',
    BORDER: 'border-border/40',
    FOCUS_BG: 'bg-background/60',
  },

  /**
   * Bubble Glass (Tier 4)
   * For: Chat bubbles, Comments
   */
  BUBBLE: {
    BG: 'bg-background/40',
    BACKDROP: 'backdrop-blur-md',
    BORDER: 'border-border/40',
    HOVER_BG: 'hover:bg-background/60',
  },
} as const

/**
 * Color Usage Rules
 * When to use each color type
 */
export const COLOR_USAGE = {
  /**
   * Use BRAND color for:
   * - Primary CTAs
   * - Important links
   * - Active states
   * - Brand elements (logo, etc.)
   */
  BRAND_USAGE: [
    'Primary call-to-action buttons',
    'Important navigation links',
    'Active navigation states',
    'Logo and brand elements',
    'Match percentage highlights',
    'AI-powered feature indicators',
  ],

  /**
   * Use PRIMARY color for:
   * - Trust actions (Connect, Save)
   * - Secondary buttons
   * - Icon accents
   */
  PRIMARY_USAGE: [
    'Connect buttons',
    'Save/Bookmark actions',
    'Confirm actions',
    'Icon accents in UI',
  ],

  /**
   * Use DESTRUCTIVE color for:
   * - Delete actions
   * - Remove actions
   * - Cancel subscriptions
   * - Critical warnings
   */
  DESTRUCTIVE_USAGE: [
    'Delete buttons',
    'Remove actions',
    'Cancel subscription',
    'Block/Report users',
  ],

  /**
   * Use SEMANTIC colors for:
   * - Success: Completed states, confirmations
   * - Warning: Pending states, cautions
   * - Error: Failed actions, validation errors
   * - Info: Informational messages
   */
  SEMANTIC_USAGE: {
    SUCCESS: ['Completed tasks', 'Confirmed actions', 'Positive feedback'],
    WARNING: ['Pending approvals', 'Caution messages', 'Expiring soon'],
    ERROR: ['Failed actions', 'Validation errors', 'System errors'],
    INFO: ['Help text', 'Tooltips', 'Informational banners'],
  },
} as const

/**
 * Dark Mode Color Adjustments
 * Specific rules for dark mode colors
 */
export const DARK_MODE_RULES = {
  // Reduce border contrast in dark mode
  BORDER_OPACITY: 'opacity-10', // 10% opacity for borders
  
  // Cards should be lighter than background for depth
  CARD_LIGHTER: 'bg-[#0A0A0F]', // Same as background but with shadow/border
  
  // Desaturate bright colors in dark mode
  DESATURATE: 'dark:saturate-75',
  
  // Reduce shadow opacity in dark mode
  SHADOW_DARK: 'dark:shadow-black/50',
} as const

/**
 * Get appropriate text color for background
 */
export function getTextColorForBackground(bg: string): string {
  const lightBg = ['bg-white', 'bg-background', 'bg-card', 'bg-secondary']
  const isLight = lightBg.some(color => bg.includes(color))
  return isLight ? 'text-foreground' : 'text-background'
}

/**
 * Validate color usage follows system
 */
export function isValidColorUsage(element: string, color: string): boolean {
  // This is a simplified validation
  // In production, you'd want more sophisticated checks
  const validColors = Object.values(SEMANTIC_COLORS).flatMap(v => Object.values(v))
  return validColors.includes(color as any)
}
