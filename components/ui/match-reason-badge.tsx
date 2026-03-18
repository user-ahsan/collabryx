import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export type MatchReasonType = "skill" | "interest" | "availability" | "stage" | "complementary"

interface MatchReasonBadgeProps {
    type: MatchReasonType
    label: string
    className?: string
}

const reasonStyles: Record<MatchReasonType, string> = {
    skill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    interest: "bg-green-500/10 text-green-400 border-green-500/20",
    availability: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    stage: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    complementary: "bg-pink-500/10 text-pink-400 border-pink-500/20",
}

const reasonIcons: Record<MatchReasonType, string> = {
    skill: "⚡",
    interest: "🎯",
    availability: "⏰",
    stage: "🚀",
    complementary: "🤝",
}

export function MatchReasonBadge({ type, label, className }: MatchReasonBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "text-[10px] px-2 py-0.5 font-medium border backdrop-blur-sm",
                reasonStyles[type],
                className
            )}
        >
            <span className="mr-1 opacity-70">{reasonIcons[type]}</span>
            {label}
        </Badge>
    )
}

interface MatchReasonBadgeGroupProps {
    reasons: Array<{
        type: MatchReasonType
        label: string
    }>
    className?: string
    maxDisplay?: number
}

export function MatchReasonBadgeGroup({ reasons, className, maxDisplay = 3 }: MatchReasonBadgeGroupProps) {
    const displayedReasons = reasons.slice(0, maxDisplay)
    const remainingCount = reasons.length - maxDisplay

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {displayedReasons.map((reason, index) => (
                <MatchReasonBadge
                    key={index}
                    type={reason.type}
                    label={reason.label}
                />
            ))}
            {remainingCount > 0 && (
                <Badge
                    variant="outline"
                    className="text-xs px-2.5 py-0.5 font-medium border-dashed text-muted-foreground/70"
                >
                    +{remainingCount}
                </Badge>
            )}
        </div>
    )
}
