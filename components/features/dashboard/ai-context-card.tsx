"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

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
        <Card className={cn("border-primary bg-card", className)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                AI Context Active
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-primary text-primary-foreground">
                                    ✨ AI
                                </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                We're matching you based on:
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={onEditContext}
                    >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                    </Button>
                </div>

                <ul className="space-y-1.5 ml-10">
                    {contexts.map((context, index) => (
                        <li key={index} className="text-sm text-foreground flex items-center">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            {context}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
