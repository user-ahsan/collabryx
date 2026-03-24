import { cn } from "@/lib/utils"

/**
 * Glass Variants - Standardized Glassmorphism System for Collabryx
 * 
 * Part of the Collabryx Design System
 * Related: @/lib/constants/spacing, @/lib/constants/typography, @/lib/constants/colors
 * 
 * Usage: import { glass, glassVariants } from "@/lib/utils/glass-variants"
 * Then: className={cn("your-classes", glass('card'))}
 * 
 * Brand Colors (PRESERVED):
 * - Dark Mode Background: #0A0A0F (Deep Navy-Black)
 * - Brand Color: oklch(0.488 0.243 264.376) (Purple-Blue)
 * - Glass Effects: Blue-tinted with blue-400/10 borders
 */

export const glassVariants = {
  /**
   * TIER 1: Primary Glass (Signature Collabryx Aesthetic)
   * For: Post cards, Match cards, Profile cards, Dashboard widgets
   */
  card: "relative overflow-hidden bg-blue-950/[0.05] backdrop-blur-2xl border border-blue-400/10 shadow-[0_4px_32px_0_rgba(59,130,246,0.06),0_1px_0_0_rgba(255,255,255,0.06)_inset] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-300/30 before:to-transparent before:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-gradient-to-b after:from-blue-300/20 after:via-transparent after:to-transparent after:pointer-events-none",
  
  /**
   * TIER 1.5: Glass Card Inner (for GlassCard innerClassName)
   * Use this as innerClassName when using GlassCard component
   */
  cardInner: "relative z-10",

  /**
   * TIER 2: Dialog/Modal Overlay Glass
   * For: DialogContent, Sheet, Modal overlays, Popovers
   * Matches postcard background: bg-blue-950/[0.05]
   */
  overlay: "bg-blue-950/[0.05] backdrop-blur-2xl border-blue-500/20 shadow-[0_8px_40px_0_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(59,130,246,0.1)]",
  
  /**
   * TIER 2.5: Dialog Highlights (decorative elements for dialogs)
   * Use as absolute positioned decorative elements
   */
  dialogHighlights: `
    before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-300/30 before:to-transparent before:pointer-events-none before:z-0
    after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-gradient-to-b after:from-blue-300/20 after:via-transparent after:to-transparent after:pointer-events-none after:z-0
  `,

  /**
   * TIER 3: Dropdown Glass
   * For: Dropdown menus, Popover content, Context menus
   */
  dropdown: "bg-card/80 backdrop-blur-xl border-border/60 shadow-lg",
  
  /**
   * TIER 3.5: Dropdown Item
   * For: Individual dropdown/popover menu items
   */
  dropdownItem: "cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-white/[0.04] transition-colors",

  /**
   * TIER 4: Bubble Glass (Comments/Chat)
   * For: Comment bubbles, Chat message bubbles
   */
  bubble: "bg-background/40 backdrop-blur-md border border-border/40 hover:bg-background/60 transition-colors",
  
  /**
   * TIER 4.5: Bubble Accent (for badges inside bubbles)
   * For: Like badges, reaction badges inside comment/chat bubbles
   */
  bubbleAccent: "bg-background border border-white/10 shadow-sm",

  /**
   * TIER 5: Subtle Glass (Inputs, Buttons, Small Elements)
   * For: Input fields, Button overlays, Small decorative elements
   */
  subtle: "bg-blue-950/[0.03] backdrop-blur-xl border-white/[0.06]",
  
  /**
   * TIER 5.5: Input Glass
   * For: Text inputs, Textareas, Search fields
   */
  input: "bg-background/40 backdrop-blur-md border border-border/40 focus:bg-background/60 focus:border-border transition-all",
  
  /**
   * TIER 5.6: Button Glass (for ghost/outline buttons)
   * For: Ghost buttons, Outline buttons with glass effect
   */
  buttonGhost: "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all",
  
  /**
   * TIER 5.7: Button Primary Glass
   * For: Primary buttons with subtle glass overlay
   */
  buttonPrimary: "bg-primary shadow-[0_4px_32px_0_rgba(59,130,246,0.06)] hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12)] transition-all",
  
  /**
   * TIER 5.8: Button Primary Glow
   * For: Primary buttons with signature blue glow
   */
  buttonPrimaryGlow: "shadow-[0_4px_20px_0_rgba(59,130,246,0.3)] hover:shadow-[0_6px_28px_0_rgba(59,130,246,0.4)] transition-all",
  
  /**
   * TIER 5.9: Button Secondary Glow
   * For: Secondary buttons with subtle glow
   */
  buttonSecondaryGlow: "shadow-[0_2px_12px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.15)] transition-all",

  /**
   * TIER 6: Media Overlay Glass
   * For: Media viewer overlays, Carousel controls, Image captions
   */
  mediaOverlay: "bg-black/40 backdrop-blur-md border border-white/10",
  
  /**
   * TIER 6.5: Media Counter
   * For: Image/video counter badges in media viewers
   */
  mediaCounter: "bg-black/60 backdrop-blur-md border border-white/10",

  /**
   * TIER 7: Tab Glass
   * For: Active tab indicators, Tab content backgrounds
   */
  tabActive: "bg-background/50 backdrop-blur-md shadow-sm border border-border/40",
  
  /**
   * TIER 7.5: Tab Inactive
   * For: Inactive tabs
   */
  tabInactive: "hover:bg-white/[0.04] transition-colors",

  /**
   * TIER 8: Badge Glass
   * For: Status badges, Notification badges, Small indicators
   */
  badge: "bg-blue-500/10 backdrop-blur-sm border border-blue-500/20",
  
  /**
   * TIER 8.5: Badge Variants
   */
  badgeSuccess: "bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-700 dark:text-green-400",
  badgeWarning: "bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  badgeError: "bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-700 dark:text-red-400",
  badgeInfo: "bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-700 dark:text-blue-400",

  /**
   * TIER 9: Section Divider Glass
   * For: Horizontal rules, Section separators
   */
  divider: "border-t border-blue-400/10 bg-gradient-to-r from-transparent via-blue-500/[0.05] to-transparent",
  
  /**
   * TIER 9.5: Vertical Divider Glass
   * For: Vertical separators
   */
  dividerVertical: "border-l border-blue-400/10 bg-gradient-to-b from-transparent via-blue-500/[0.05] to-transparent",

  /**
   * TIER 10: Header/Footer Glass
   * For: Sticky headers, Footers with glass effect
   */
  header: "bg-background/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50",
  
  /**
   * TIER 10.5: Footer Glass
   */
  footer: "bg-background/80 backdrop-blur-xl border-t border-border/40",

  /**
   * TIER 11: Skill Matrix Glass
   * For: Skill cards, Proficiency indicators, Skill grid tiles
   */
  skillCard: "relative overflow-hidden bg-blue-950/[0.04] backdrop-blur-xl border border-blue-400/10 shadow-[0_4px_24px_0_rgba(59,130,246,0.04)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-300/30 before:to-transparent before:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-gradient-to-b after:from-blue-300/20 after:via-transparent after:to-transparent after:pointer-events-none",
  
  /**
   * TIER 11.5: Skill Card Active/Selected
   * For: Selected skill tiles, Active state with stronger glow
   */
  skillCardActive: "relative overflow-hidden bg-blue-950/[0.04] backdrop-blur-xl border border-blue-400/30 shadow-[0_8px_40px_0_rgba(59,130,246,0.15)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-300/30 before:to-transparent before:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-gradient-to-b after:from-blue-300/20 after:via-transparent after:to-transparent after:pointer-events-none",
  
  /**
   * TIER 11.7: Proficiency Ring Background
   * For: Subtle glass background behind proficiency rings/circles
   */
  proficiencyRing: "bg-blue-950/[0.06] backdrop-blur-xl border border-blue-400/15 rounded-full",
  
  /**
   * TIER 11.9: Skill Card Hoverable
   * For: Interactive skill cards with hover effects
   */
  skillCardHoverable: "transition-all duration-500 hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12)] hover:-translate-y-1",

  /**
   * UTILITY: Glass Card Hover Effects
   * Add to any glass card for hover interaction
   */
  hoverable: "transition-all duration-500 hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12),0_1px_0_0_rgba(255,255,255,0.08)_inset] hover:-translate-y-1",

  /**
   * UTILITY: Glass Pulse Animation
   * For: Loading states, Active indicators
   */
  pulse: "animate-pulse",

  /**
   * UTILITY: Glass Shine Effect
   * For: Premium/highlight elements
   */
  shine: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent before:-translate-x-full before:animate-shine",
}

/**
 * Helper function to apply glass variant with additional classes
 * @param variant - The glass variant to apply
 * @param className - Additional Tailwind classes to merge
 * @returns Combined class names
 */
export function glass(variant: keyof typeof glassVariants, className?: string) {
  return cn(glassVariants[variant], className)
}

/**
 * Glass decoration utilities for manual application
 * Use these to add decorative glass elements to any component
 */
export const glassDecorations = {
  /** Top highlight streak */
  topHighlight: "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none",
  
  /** Left edge highlight */
  leftHighlight: "absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none",
  
  /** Blue ambient tint overlay */
  ambientTint: "absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none",
  
  /** Noise texture overlay (for premium feel) */
  noise: "before:absolute before:inset-0 before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')] before:bg-repeat before:bg-[150px_150px] before:opacity-[0.05] before:mix-blend-overlay before:pointer-events-none",
  
  /** Inner shadow for depth */
  innerShadow: "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
  
  /** Outer glow for emphasis */
  outerGlow: "shadow-[0_4px_32px_0_rgba(59,130,246,0.06)]",
}
