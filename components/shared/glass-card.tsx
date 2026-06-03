import { cn } from "@/lib/utils"

/**
 * GlassCard - Signature Collabryx glassmorphism card
 * 
 * PROBLEM SOLVED:
 * This component had its entire glass aesthetic stripped during a refactor.
 * The original version rendered three decorative <div> elements (top highlight
 * streak, left edge highlight, blue ambient tint overlay) alongside inline
 * Tailwind classes for backdrop-blur-2xl, blue-tinted backgrounds, and
 * ambient glow shadows. When these were extracted to glass-variants.ts, the
 * DOM decorative elements were deleted and the replacement glassDecorations
 * entries were left as empty strings. The result was a flat, grounded card
 * with "no decorative gradients, no blue tint, no frosted glass" — losing
 * the signature Collabryx identity across all ~95 instances.
 * 
 * Additionally, the `glow` prop existed in the interface but was only mapped
 * to a trivial "shadow-md shadow-black/5", making it effectively non-functional.
 * Components like analytics-content.tsx and billing/page.tsx were passing
 * <GlassCard glow> expecting visual emphasis but getting none.
 * 
 * SOLUTION:
 * Rather than re-add three DOM elements per card (which bloats the component
 * tree), the glass effects are now delivered via CSS pseudo-elements defined
 * in globals.css (.glass-glow, .glass-glow-hover, .glass-glow-strong).
 * This component:
 * 
 * 1. Applies .glass-glow as its base class — this gives every GlassCard
 *    the full glass aesthetic: frosted blur, blue tint, ambient glow shadow,
 *    top/left edge highlights, and blue tint overlay — all via CSS
 *    ::before/::after pseudo-elements (zero extra DOM nodes).
 * 
 * 2. Maps hoverable → .glass-glow-hover — 300ms cubic-bezier transition,
 *    2px lift, intensified glow on hover for interactive feedback.
 * 
 * 3. Maps glow → .glass-glow-strong — stronger border opacity, amplified
 *    blue glow aura (60px spread) for emphasis cards. This finally makes
 *    the long-broken glow prop actually work as intended.
 * 
 * 4. Uses isolation: isolate and z-index: -1 on pseudo-elements to ensure
 *    decorative overlays render behind content without needing manual
 *    z-index management on children.
 * 
 * WHY THIS APPROACH IS BETTER THAN THE ORIGINAL:
 * - Zero extra DOM nodes (vs 3 <div>s per card originally)
 * - Any element can get the glow with just className="glass-glow"
 * - Single source of truth in CSS instead of scattered Tailwind classes
 * - Dark mode variants handled in one place
 * - The glow prop finally does something meaningful
 * 
 * Usage:
 * <GlassCard hoverable className="p-6" innerClassName="space-y-4">
 *   <h3 className="text-h3">Card Title</h3>
 *   <p className="text-body">Content</p>
 * </GlassCard>
 * 
 * <GlassCard glow> - Stronger emphasis (billing stats, analytics)
 * <GlassCard hoverable> - Interactive lift + glow on hover
 */

interface GlassCardProps {
    children: React.ReactNode
    className?: string
    innerClassName?: string
    /** Lift + enhanced glow on hover (interactive cards) */
    hoverable?: boolean
    /** Stronger ambient glow for emphasis (billing, analytics highlights) */
    glow?: boolean
    /** Optional click handler for the whole card */
    onClick?: () => void
}

export function GlassCard({
    children,
    className,
    innerClassName,
    hoverable = false,
    glow = false,
    onClick,
}: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick() } : undefined}
            className={cn(
                "glass-glow",
                "w-full rounded-xl",
                hoverable && "glass-glow-hover",
                glow && "glass-glow-strong",
                onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                className
            )}
        >
            <div className={cn("relative z-10", innerClassName)}>
                {children}
            </div>
        </div>
    )
}
