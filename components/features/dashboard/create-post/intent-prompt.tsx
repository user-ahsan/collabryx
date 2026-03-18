"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface IntentOption {
    id: string
    label: string
    icon: string
    description: string
}

const INTENT_OPTIONS: IntentOption[] = [
    {
        id: "collaboration",
        label: "Collaboration",
        icon: "🤝",
        description: "Looking for collaborators"
    },
    {
        id: "feedback",
        label: "Feedback",
        icon: "💡",
        description: "Need feedback on something"
    },
    {
        id: "showcase",
        label: "Showcase",
        icon: "✨",
        description: "Sharing my work"
    },
    {
        id: "question",
        label: "Question",
        icon: "❓",
        description: "Have a question"
    },
    {
        id: "resource",
        label: "Resource",
        icon: "📚",
        description: "Sharing a resource"
    },
    {
        id: "opportunity",
        label: "Opportunity",
        icon: "🚀",
        description: "Job or opportunity"
    }
]

interface IntentPromptProps {
    className?: string
    onSelectIntent: (intentId: string) => void
}

export function IntentPrompt({ className, onSelectIntent }: IntentPromptProps) {
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    const handleSelectIntent = (intentId: string) => {
        setSelectedIntent(intentId)
        onSelectIntent(intentId)
        setIsExpanded(false)
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full justify-start gap-2 h-auto py-2 px-3",
                    glass("input"),
                    selectedIntent && "bg-primary/5 border-primary/20"
                )}
            >
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    {selectedIntent 
                        ? INTENT_OPTIONS.find(o => o.id === selectedIntent)?.label
                        : "Add intent (optional)"}
                </span>
            </Button>

            {isExpanded && (
                <div className={cn("grid grid-cols-2 gap-2 p-2 rounded-lg", glass("subtle"))}>
                    {INTENT_OPTIONS.map((option) => (
                        <Button
                            key={option.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectIntent(option.id)}
                            className={cn(
                                "justify-start gap-2 h-auto py-2 px-3 text-sm",
                                selectedIntent === option.id && "bg-primary text-primary-foreground"
                            )}
                        >
                            <span className="text-base">{option.icon}</span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
}
