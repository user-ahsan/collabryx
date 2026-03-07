"use client"

import { cn } from "@/lib/utils"

interface PostCardProps {
    children: React.ReactNode
    className?: string
}

export function PostCard({ children, className }: PostCardProps) {
    return (
        <div className={cn(
            "group relative rounded-xl md:rounded-2xl overflow-hidden",
            "bg-blue-950/[0.05] backdrop-blur-2xl",
            "border border-blue-400/10",
            "shadow-[0_4px_32px_0_rgba(59,130,246,0.06),0_1px_0_0_rgba(255,255,255,0.06)_inset]",
            "hover:shadow-[0_8px_40px_0_rgba(59,130,246,0.12),0_1px_0_0_rgba(255,255,255,0.08)_inset]",
            "transition-all duration-500",
            className
        )}>
            {/* Top highlight streak */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none" />
            {/* Left edge highlight */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none" />
            {/* Blue ambient tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none" />

            <div className="p-5 sm:p-6 lg:p-7 relative z-10">
                {children}
            </div>
        </div>
    )
}
