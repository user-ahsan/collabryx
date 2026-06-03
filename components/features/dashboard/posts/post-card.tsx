import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

/**
 * PostCard - Post container
 *
 * GLASS GLOW RESTORATION:
 * This component wraps GlassCard with hoverable enabled. Previously, the
 * comment read "No glow, no glass" because the GlassCard component had
 * lost its glass aesthetic during a refactor. With the glass-glow CSS
 * system now in place, GlassCard renders the full signature Collabryx
 * glass aesthetic by default — frosted blue background, ambient glow
 * shadow, top/left edge highlight streaks, and blue tint overlay.
 * The hoverable prop maps to .glass-glow-hover which provides 2px lift
 * and intensified glow on interaction.
 *
 * w-full + max-w-full to respect parent constraints.
 */

interface PostCardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export function PostCard({ children, className, onClick }: PostCardProps) {
    return (
        <GlassCard
            hoverable
            className={cn(
                "w-full max-w-full",
                className,
                onClick && "cursor-pointer"
            )}
            innerClassName="p-4 sm:p-6 lg:p-8"
            onClick={onClick}
        >
            {children}
        </GlassCard>
    )
}
