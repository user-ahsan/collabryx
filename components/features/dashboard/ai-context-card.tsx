"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
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
                    <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                            "px-2.5 py-1.5 text-xs font-medium rounded-full",
                            glass("badge")
                        )}
                    >
                        {context}
                    </Badge>
                ))}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 px-3 text-sm text-muted-foreground rounded-full ml-auto",
                    glass("buttonGhost")
                )}
                onClick={onEditContext}
            >
                <Settings2 className="h-3 w-3 mr-1" />
                Edit
            </Button>
        </GlassCard>
    )
}
