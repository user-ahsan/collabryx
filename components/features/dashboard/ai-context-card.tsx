"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

interface AIContextCardProps {
    contexts?: string[]
    onEditContext?: () => void
    className?: string
}

const DEFAULT_CONTEXTS = [
    "Fintech interest",
    "Python backend skills",
    "MVP-stage availability"
]

export function AIContextCard({
    contexts = DEFAULT_CONTEXTS,
    onEditContext,
    className
}: AIContextCardProps) {
    return (
        <GlassCard className={cn("px-1 py-1 sm:py-2", className)} innerClassName="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">Matching on:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
                {contexts.map((context, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/15"
                    >
                        {context}
                    </span>
                ))}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-full ml-auto"
                onClick={onEditContext}
            >
                <Settings2 className="h-3 w-3 mr-1" />
                Edit
            </Button>
        </GlassCard>
    )
}
