import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

/**
 * PostCard - Standardized post container
 * 
 * Design System Compliance:
 * - 4-point grid spacing: p-4 sm:p-6 lg:p-8
 * - Consistent shadow system via GlassCard
 * - Transition duration: 300ms
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
                "transition-all duration-300 ease-in-out opacity-100",
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
