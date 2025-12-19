"use client"

import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type VerificationType = "student" | "faculty" | "alumni"

interface VerificationBadgeProps {
    type: VerificationType
    university?: string
    className?: string
}

const getVerificationLabel = (type: VerificationType) => {
    switch (type) {
        case "student":
            return "Verified Student"
        case "faculty":
            return "Verified Faculty"
        case "alumni":
            return "Verified Alumni"
    }
}

const getVerificationTooltip = (type: VerificationType, university?: string) => {
    const universityName = university || "their university"
    switch (type) {
        case "student":
            return `Verified as a current student at ${universityName} through official university records.`
        case "faculty":
            return `Verified as faculty member at ${universityName} through institutional authentication.`
        case "alumni":
            return `Verified as an alumnus of ${universityName} through institutional records.`
    }
}

export function VerificationBadge({ type, university, className }: VerificationBadgeProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs px-2 py-1 font-medium border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 cursor-help",
                            className
                        )}
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1 fill-blue-500 text-white dark:fill-blue-400" />
                        {getVerificationLabel(type)}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{getVerificationTooltip(type, university)}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
