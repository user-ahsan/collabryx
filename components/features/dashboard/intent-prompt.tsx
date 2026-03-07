"use client"

import { Button } from "@/components/ui/button"
import { Rocket, Users, Wrench, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface IntentOption {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}

const intentOptions: IntentOption[] = [
    {
        id: "cofounder",
        label: "Looking for co-founder",
        icon: Rocket,
        color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20"
    },
    {
        id: "teammate",
        label: "Looking for teammate",
        icon: Users,
        color: "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-teal-500/20"
    },
    {
        id: "mvp",
        label: "Building MVP",
        icon: Wrench,
        color: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20"
    },
    {
        id: "fyp",
        label: "FYP / Hackathon",
        icon: GraduationCap,
        color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20"
    }
]

interface IntentPromptProps {
    onSelectIntent?: (intentId: string) => void
    className?: string
}

export function IntentPrompt({ onSelectIntent, className }: IntentPromptProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {intentOptions.map((option) => {
                const Icon = option.icon
                return (
                    <Button
                        key={option.id}
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-8 px-3 border transition-all",
                            option.color
                        )}
                        onClick={() => onSelectIntent?.(option.id)}
                    >
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-xs font-medium">{option.label}</span>
                    </Button>
                )
            })}
        </div>
    )
}
