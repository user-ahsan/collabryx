"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Users, Wrench, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface IntentOption {
    id: string
    label: string
    icon: any
    color: string
}

const intentOptions: IntentOption[] = [
    {
        id: "cofounder",
        label: "Looking for co-founder",
        icon: Rocket,
        color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 border-blue-300 dark:border-blue-800"
    },
    {
        id: "teammate",
        label: "Looking for teammate",
        icon: Users,
        color: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900 border-green-300 dark:border-green-800"
    },
    {
        id: "mvp",
        label: "Building MVP",
        icon: Wrench,
        color: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900 border-orange-300 dark:border-orange-800"
    },
    {
        id: "fyp",
        label: "FYP / Hackathon",
        icon: GraduationCap,
        color: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border-purple-300 dark:border-purple-800"
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
