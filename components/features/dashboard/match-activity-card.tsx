"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { GlassCard } from "@/components/shared/glass-card"
import { toast } from "sonner"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { fetchMatchActivity } from "@/lib/services/matches"
import type { MatchActivityWithUser } from "@/lib/services/matches"
import { TOAST_MESSAGES, TOAST_IDS } from "@/lib/constants/toast-messages"

interface MatchActivityCardProps {
    className?: string
}

export function MatchActivityCard({
    className
}: MatchActivityCardProps) {
    const [activities, setActivities] = useState<MatchActivityWithUser[]>([])
    const [isFetching, setIsFetching] = useState(false)

    const fetchActivities = useCallback(async () => {
        setIsFetching(true)
        try {
            const { data, error } = await fetchMatchActivity({ limit: 5 })

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: MatchActivityWithUser[] = data.map((activity) => ({
                    ...activity,
                    user_name: activity.user_name ?? "Unknown",
                    user_avatar: activity.user_avatar ?? "",
                    user_initials: activity.user_initials ?? "U",
                }))
                setActivities(mapped)
                setCache(CACHE_KEYS.MATCH_ACTIVITY, mapped)
            } else {
                setActivities([])
            }
        } catch {
            const cached = getCache<MatchActivityWithUser[]>(CACHE_KEYS.MATCH_ACTIVITY)
            if (cached) {
                setActivities(cached)
                toast.info(TOAST_MESSAGES.ACTIVITY.CACHE, { id: TOAST_IDS.ACTIVITY })
            }
        } finally {
            setIsFetching(false)
        }
    }, [])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    if (activities.length === 0 && !isFetching) return null

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
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                                glass("tabInactive")
                            )}
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
                                <p className={cn(
                                    "text-xs font-semibold mt-1",
                                    glass("badge")
                                )}>
                                    {activity.match_percentage}% match
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}

