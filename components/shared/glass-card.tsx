import { cn } from "@/lib/utils"

/**
 * GlassCard - Standardized glassmorphism card component
 * 
 * Design System Compliance:
 * - Uses 4-point grid spacing (p-4, p-6, p-8)
 * - Consistent shadow system (shadow-glass-card)
 * - Brand colors preserved (#0A0A0F background compatible)
 * - Transition duration: 300ms (snappy)
 * 
 * Usage:
 * <GlassCard hoverable className="p-6" innerClassName="space-y-4">
 *   <h3 className="text-h3">Card Title</h3>
 *   <p className="text-body">Content</p>
 * </GlassCard>
 */

interface GlassCardProps {
    children: React.ReactNode
    className?: string
    innerClassName?: string
    /** Whether to show the hover shadow effect */
    hoverable?: boolean
    /** Optional click handler for the whole card */
    onClick?: () => void
}

/**
 * Shared glass-card wrapper with the ambient blue aesthetic.
 * Replaces duplicated styling across post-card, match-activity-card,
 * suggestions-sidebar, AI mentor card, create-post trigger, etc.
 */
export function GlassCard({
    children,
    className,
    innerClassName,
    hoverable = false,
    onClick,
}: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative rounded-xl md:rounded-2xl overflow-hidden",
                "bg-blue-950/[0.05] backdrop-blur-2xl",
                "border border-blue-400/10",
                "shadow-glass-card",
                hoverable &&
                "hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12),0_1px_0_0_rgba(255,255,255,0.08)_inset]",
                "transition-all duration-300 ease-in-out",
                className
            )}
        >
            {/* Decorative highlights (preserved brand aesthetic) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none" />

            <div className={cn("relative z-10", innerClassName)}>
                {children}
            </div>
        </div>
    )
}
