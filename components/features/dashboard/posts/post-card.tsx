import { GlassCard } from "@/components/shared/glass-card"

interface PostCardProps {
    children: React.ReactNode
    className?: string
}

export function PostCard({ children, className }: PostCardProps) {
    return (
        <GlassCard hoverable className={className} innerClassName="p-3.5 sm:p-5 lg:p-7">
            {children}
        </GlassCard>
    )
}
