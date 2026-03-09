import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type MatchReasonType = "skill" | "interest" | "availability" | "stage" | "complementary"

interface MatchReasonBadgeProps {
    type: MatchReasonType
    label: string
    className?: string
}

const reasonColors: Record<MatchReasonType, string> = {
    skill: "bg-muted/50 text-muted-foreground border-border",
    interest: "bg-muted/50 text-muted-foreground border-border",
    availability: "bg-muted/50 text-muted-foreground border-border",
    stage: "bg-muted/50 text-muted-foreground border-border",
    complementary: "bg-muted/50 text-muted-foreground border-border",
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
                "text-[10px] px-2 py-0.5 font-medium border",
                reasonColors[type],
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
