import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

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
                "transition-all duration-300 ease-in-out opacity-0 animate-in fade-in",
                className, 
                onClick && "cursor-pointer", 
                "shadow-md"
            )}
            innerClassName="p-3.5 sm:p-6 lg:p-8"
            onClick={onClick}
        >
            {children}
        </GlassCard>
    )
}
