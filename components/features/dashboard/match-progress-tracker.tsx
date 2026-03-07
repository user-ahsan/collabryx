"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Users, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"

interface TeamRole {
    role: string
    filled: boolean
    name?: string
}

interface MatchProgressTrackerProps {
    projectName?: string
    requiredRoles?: TeamRole[]
    className?: string
}

const DEFAULT_ROLES: TeamRole[] = [
    { role: "Technical Lead", filled: true, name: "You" },
    { role: "UI/UX Designer", filled: true, name: "Alex Rivera" },
    { role: "Marketing Lead", filled: false },
    { role: "Backend Developer", filled: true, name: "Sarah Chen" },
    { role: "Business Analyst", filled: false },
]

export function MatchProgressTracker({
    projectName = "Fintech Team",
    requiredRoles = DEFAULT_ROLES,
    className
}: MatchProgressTrackerProps) {
    const filledCount = requiredRoles.filter(r => r.filled).length
    const totalCount = requiredRoles.length
    const progressPercentage = Math.round((filledCount / totalCount) * 100)

    return (
        <GlassCard className={className}>
            <div className="p-4 pb-3 border-b border-white/[0.06]">
                <div className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    Team Progress
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-primary/10 text-primary ml-auto">
                        {filledCount}/{totalCount}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {projectName}
                </p>
            </div>
            <div className="p-4 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                            {progressPercentage}% Complete
                        </span>
                        <span className="text-muted-foreground">
                            {totalCount - filledCount} roles left
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Roles List — CSS stagger instead of framer-motion */}
                <div className="space-y-2">
                    {requiredRoles.map((role, index) => (
                        <div
                            key={role.role}
                            className={cn(
                                "flex items-start gap-2.5 p-2 rounded-lg transition-colors animate-in fade-in slide-in-from-left-2",
                                role.filled ? "bg-primary/5" : "bg-muted/30"
                            )}
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                        >
                            {role.filled ? (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            ) : (
                                <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-medium leading-tight",
                                    role.filled ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {role.role}
                                </p>
                                {role.filled && role.name && (
                                    <p className="text-[10px] text-primary font-medium mt-0.5">
                                        {role.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                {filledCount < totalCount && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs font-medium border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                    >
                        Find Team Members
                        <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                )}

                {filledCount === totalCount && (
                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                            Team Complete! 🎉
                        </span>
                    </div>
                )}
            </div>
        </GlassCard>
    )
}

