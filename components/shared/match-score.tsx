"use client"

import { motion } from "framer-motion"
import { Sparkles, Brain, TrendingUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { GlassCard } from "@/components/shared/glass-card"
import { getScoreColorClasses, getConfidenceLevel } from "@/lib/services/match-scores"

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
    aiConfidence?: number
    aiExplanation?: string
}

const defaultDimensions: MatchDimension[] = [
    { label: "Skills", value: 85, color: "bg-blue-500" },
    { label: "Interests", value: 92, color: "bg-green-500" },
    { label: "Goals", value: 78, color: "bg-purple-500" },
    { label: "Availability", value: 88, color: "bg-amber-500" },
]

export function MatchScore({
    overall,
    dimensions = defaultDimensions,
    showBreakdown = true,
    onClick,
    className,
    aiConfidence,
    aiExplanation
}: MatchScoreProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const scoreColors = getScoreColorClasses(overall)

    return (
        <GlassCard 
            hoverable={!!onClick} 
            onClick={onClick}
            className={cn("p-3", className)}
        >
            {/* Main Score Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className={cn("h-3 w-3", scoreColors.text)} />
                    <span>Match Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={cn("text-lg font-bold", scoreColors.text)}>{overall}%</span>
                </div>
            </div>

            {/* Overall Progress Bar - Thicker for better visibility */}
            <div className="mb-3">
                <div className="h-3 bg-blue-950/30 rounded-full overflow-hidden ring-1 ring-blue-400/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overall}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn("h-full rounded-full", scoreColors.progress)}
                    />
                </div>
            </div>

            {/* AI Confidence Indicator */}
            {aiConfidence && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex items-center justify-between px-2 py-1.5 rounded-md bg-blue-500/5 border border-blue-400/10"
                >
                    <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[10px] text-muted-foreground">AI Confidence</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-bold", scoreColors.text)}>
                            {Math.round(aiConfidence * 100)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                            {getConfidenceLevel(aiConfidence)}
                        </span>
                    </div>
                </motion.div>
            )}

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
                <TrendingUp className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
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
                    {dimensions.map((dimension, index) => {
                        const dimColor = dimension.value >= 85 ? "text-green-400" :
                            dimension.value >= 75 ? "text-blue-400" :
                            dimension.value >= 65 ? "text-amber-400" : "text-muted-foreground"
                        
                        return (
                            <motion.div
                                key={dimension.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="space-y-1.5"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{dimension.label}</span>
                                    <span className={cn("font-semibold", dimColor)}>{dimension.value}%</span>
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
                        )
                    })}

                    {/* AI Explanation */}
                    {aiExplanation && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-400/10"
                        >
                            <div className="flex items-start gap-2">
                                <Brain className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-medium text-blue-400">AI Analysis</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {aiExplanation}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
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
            "p-1.5 rounded-lg",
            glass("subtle"),
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
                "bg-muted/50 rounded-full overflow-hidden",
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
