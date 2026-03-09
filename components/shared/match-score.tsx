"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

interface MatchDimension {
    label: string
    value: number
    color: string
}

interface MatchScoreProps {
    overall: number
    dimensions?: MatchDimension[]
    showBreakdown?: boolean
    onClick?: () => void
    className?: string
}

const defaultDimensions: MatchDimension[] = [
    { label: "Skills", value: 85, color: "bg-blue-500" },
    { label: "Interests", value: 92, color: "bg-green-500" },
    { label: "Availability", value: 78, color: "bg-purple-500" },
    { label: "Stage", value: 88, color: "bg-amber-500" },
]

export function MatchScore({
    overall,
    dimensions = defaultDimensions,
    showBreakdown = true,
    onClick,
    className
}: MatchScoreProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <GlassCard 
            hoverable={!!onClick} 
            onClick={onClick}
            className={cn("p-3", className)}
        >
            {/* Main Score Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Match Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-primary">{overall}%</span>
                </div>
            </div>

            {/* Overall Progress Bar - Thicker for better visibility */}
            <div className="mb-3">
                <div className="h-3 bg-blue-950/30 rounded-full overflow-hidden ring-1 ring-blue-400/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overall}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full",
                            overall >= 90 ? "bg-gradient-to-r from-blue-500 to-blue-400" :
                            overall >= 75 ? "bg-gradient-to-r from-green-500 to-green-400" :
                            "bg-gradient-to-r from-amber-500 to-amber-400"
                        )}
                    />
                </div>
            </div>

            {/* Prominent Toggle Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                }}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                    isExpanded 
                        ? "bg-blue-500/10 text-blue-400 border border-blue-400/20" 
                        : "bg-blue-950/30 hover:bg-blue-950/50 text-muted-foreground border border-transparent hover:border-blue-400/10"
                )}
            >
                <span>{isExpanded ? "Hide" : "See"} breakdown</span>
                <Sparkles className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
            </button>

            {/* Dimension Breakdown - Always visible when expanded */}
            {showBreakdown && isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pt-3 space-y-3 border-t border-blue-400/10 mt-3"
                >
                    {dimensions.map((dimension, index) => (
                        <motion.div
                            key={dimension.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="space-y-1.5"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{dimension.label}</span>
                                <span className="font-semibold text-foreground">{dimension.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-blue-950/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${dimension.value}%` }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className={cn("h-full rounded-full", dimension.color)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </GlassCard>
    )
}

// Compact version for sidebar/smaller cards - LinkedIn style
export function MatchScoreCompact({
    overall,
    className,
    horizontal = false
}: {
    overall: number
    className?: string
    horizontal?: boolean
}) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-green-500"
        if (score >= 75) return "bg-amber-500"
        return "bg-muted"
    }

    return (
        <div className={cn(
            horizontal ? "flex items-center gap-2" : "flex flex-col items-center",
            className
        )}>
            <span className={cn(
                "font-bold",
                horizontal ? "text-sm" : "text-lg",
                overall >= 90 ? "text-green-400" :
                overall >= 75 ? "text-amber-400" :
                "text-muted-foreground"
            )}>
                {overall}%
            </span>
            {/* Thin accent line instead of thick bar */}
            <div className={cn(
                "bg-muted rounded-full overflow-hidden",
                horizontal ? "w-12 h-1" : "w-16 h-0.5"
            )}>
                <div
                    className={cn("h-full rounded-full transition-all", getScoreColor(overall))}
                    style={{ width: `${overall}%` }}
                />
            </div>
        </div>
    )
}
