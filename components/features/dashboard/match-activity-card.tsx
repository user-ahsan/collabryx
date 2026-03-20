"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { GlassCard } from "@/components/shared/glass-card"
import { getCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { useMatchActivity } from "@/hooks/use-matches-query"
import type { MatchActivityWithUser } from "@/lib/services/matches"

interface MatchActivityCardProps {
    className?: string
}

export function MatchActivityCard({
    className
}: MatchActivityCardProps) {
    const [activities, setActivities] = useState<MatchActivityWithUser[]>([])
    const { data, isLoading, error } = useMatchActivity()

    useEffect(() => {
        if (data && data.length > 0) {
            const mapped: MatchActivityWithUser[] = data.map((activity) => ({
                ...activity,
                user_name: activity.user_name ?? "Unknown",
                user_avatar: activity.user_avatar ?? "",
                user_initials: activity.user_initials ?? "U",
            }))
            setActivities(mapped)
        } else if (error) {
            // Try to load from cache on error
            const cached = getCache<MatchActivityWithUser[]>(CACHE_KEYS.MATCH_ACTIVITY)
            if (cached) {
                setActivities(cached)
            } else {
                setActivities([])
            }
        } else {
            setActivities([])
        }
    }, [data, error])

    // Don't render if no activities and not loading
    if (activities.length === 0 && !isLoading) return null

    // Show skeleton while loading
    if (isLoading) {
        return (
            <GlassCard className={cn(className)}>
                <div className="p-4 md:p-5 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 bg-blue-500/10 rounded-lg" />
                            <div>
                                <div className="h-4 w-32 bg-muted rounded mb-1" />
                                <div className="h-3 w-40 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="h-8 w-20 bg-muted rounded" />
                    </div>
                    <div className="space-y-1.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5">
                                <div className="h-9 w-9 rounded-full bg-muted" />
                                <div className="flex-1">
                                    <div className="h-3 w-3/4 bg-muted rounded mb-1" />
                                    <div className="h-2 w-16 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        )
    }

    return (
        <GlassCard className={cn(className)}>
            <div className="p-4 md:p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                            <Bell className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                New Match Activity
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Recent collaboration opportunities
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-8 px-3 text-sm text-muted-foreground transition-colors cursor-pointer",
                            glass("buttonGhost")
                        )}
                        onClick={() => window.location.href = '/activity'}
                    >
                        View All
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                {/* Activity Items */}
                <div className="space-y-1.5">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/[0.04]",
                                glass("tabInactive")
                            )}
                            onClick={() => window.location.href = '/activity'}
                        >
                            <Avatar className={cn(
                                "h-9 w-9 shrink-0",
                                glass("bubbleAccent")
                            )}>
                                <AvatarImage src={activity.user_avatar} />
                                <AvatarFallback className="text-xs bg-blue-500/10 text-blue-400 font-bold">
                                    {activity.user_initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-snug">
                                    <span className="font-medium">{activity.user_name}</span>{" "}
                                    <span className="text-muted-foreground">{activity.activity}</span>
                                </p>
                                {activity.match_percentage && (
                                    <p className={cn(
                                        "text-xs font-semibold mt-1",
                                        glass("badge")
                                    )}>
                                        {activity.match_percentage}% match
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}
