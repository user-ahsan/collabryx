"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { MOCK_MATCH_ACTIVITY } from "@/lib/mock-data/dashboard"
import type { MatchActivity } from "@/lib/mock-data/dashboard"

interface MatchActivityCardProps {
    className?: string
}

export function MatchActivityCard({
    className
}: MatchActivityCardProps) {
    const [activities, setActivities] = useState<MatchActivity[]>(MOCK_MATCH_ACTIVITY)
    const [isFetching, setIsFetching] = useState(false)

    const fetchActivities = useCallback(async () => {
        setIsFetching(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data, error } = await supabase
                .from("match_activity")
                .select("*")
                .eq("target_user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5)

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: MatchActivity[] = data.map((r: Record<string, unknown>) => ({
                    id: String(r.id),
                    type: (r.type as MatchActivity["type"]) || "profile_view",
                    userName: String(r.user_name ?? "Unknown"),
                    userAvatar: String(r.user_avatar ?? ""),
                    userInitials: String(r.user_name ?? "U").slice(0, 2).toUpperCase(),
                    matchPercentage: typeof r.match_percentage === "number" ? r.match_percentage : 0,
                    activity: String(r.activity ?? ""),
                }))
                setActivities(mapped)
                setCache(CACHE_KEYS.MATCH_ACTIVITY, mapped)
            } else {
                setActivities([])
            }
        } catch {
            // API failed → try cache → fallback to hardcoded
            const cached = getCache<MatchActivity[]>(CACHE_KEYS.MATCH_ACTIVITY)
            if (cached) {
                setActivities(cached)
                toast.info("Showing cached activity data", { id: "match-activity-cache" })
            } else {
                setActivities(MOCK_MATCH_ACTIVITY)
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
                        className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors cursor-pointer"
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
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                        >
                            <Avatar className="h-9 w-9 border border-white/[0.08] shadow-sm shrink-0">
                                <AvatarImage src={activity.userAvatar} />
                                <AvatarFallback className="text-xs bg-blue-500/10 text-blue-400 font-bold">
                                    {activity.userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-snug">
                                    <span className="font-medium">{activity.userName}</span>{" "}
                                    <span className="text-muted-foreground">{activity.activity}</span>
                                </p>
                                <p className="text-xs font-semibold text-primary mt-1">
                                    {activity.matchPercentage}% match
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}

