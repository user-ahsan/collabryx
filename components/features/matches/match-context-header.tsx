"use client"

import { Sparkles, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"

interface MatchContextHeaderProps {
    matchCount: number
    isGenerating?: boolean
    onGenerateMatches?: () => void
}

export function MatchContextHeader({
    matchCount = 0,
    isGenerating = false,
    onGenerateMatches
}: MatchContextHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 w-full"
        >
            <GlassCard innerClassName="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Title and Match Count */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground shrink-0">
                            Matches
                        </h1>
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shrink-0">
                            <Sparkles className="mr-1.5 h-3 w-3" />
                            <span>{matchCount} found</span>
                        </div>
                    </div>

                    {/* Generate More Matches Button */}
                    {onGenerateMatches && (
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 text-xs font-medium shrink-0 shadow-sm"
                            onClick={onGenerateMatches}
                            disabled={isGenerating}
                        >
                            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                            {isGenerating ? "Generating..." : "Generate More"}
                        </Button>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    )
}
