import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

/**
 * GlassCard - Standardized glassmorphism card component
 * 
 * Design System Compliance:
 * - Uses glass("card") variant for consistent styling
 * - Uses glass("hoverable") for hover effects
 * - Uses 4-point grid spacing (p-4, p-6, p-8)
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
                glass("card"),
                hoverable && glass("hoverable"),
                "transition-all duration-300 ease-in-out",
                className
            )}
        >
            <div className={cn("relative z-10", innerClassName)}>
                {children}
            </div>
        </div>
    )
}
