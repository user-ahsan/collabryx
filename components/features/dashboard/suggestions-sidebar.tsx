"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, UserPlus, Eye, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { MOCK_MATCHES } from "@/lib/mock-data/dashboard"
import type { MatchSuggestion, MatchReason } from "@/lib/mock-data/dashboard"
import { MatchActivityCard } from "./match-activity-card"
import { GlassCard } from "@/components/shared/glass-card"

interface MatchIntelligencePanelProps {
    className?: string
}

const getReasonColor = (type: MatchReason["type"]) => {
    switch (type) {
        case "skill":
            return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
        case "interest":
            return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900"
        case "availability":
            return "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900"
    }
}

export function SuggestionsSidebar({ className }: MatchIntelligencePanelProps) {
    const [matches, setMatches] = useState<MatchSuggestion[]>(MOCK_MATCHES)
    const [isLoading, setIsLoading] = useState(false)

    // ── API → Cache → Hardcoded Fallback ──
    const fetchMatches = useCallback(async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data, error } = await supabase
                .from("match_suggestions")
                .select("*")
                .eq("user_id", user.id)
                .order("match_percentage", { ascending: false })
                .limit(5)

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: MatchSuggestion[] = data.map(
                    (r: Record<string, unknown>) => ({
                        id: String(r.id),
                        name: String(r.name ?? "Unknown"),
                        role: String(r.role ?? ""),
                        avatar: String(r.avatar ?? ""),
                        initials: String(r.name ?? "U")
                            .slice(0, 2)
                            .toUpperCase(),
                        matchPercentage:
                            typeof r.match_percentage === "number"
                                ? r.match_percentage
                                : 0,
                        reasons: Array.isArray(r.reasons)
                            ? (r.reasons as MatchReason[])
                            : [],
                    })
                )
                setMatches(mapped)
                setCache(CACHE_KEYS.MATCHES, mapped)
            }
        } catch {
            const cached = getCache<MatchSuggestion[]>(CACHE_KEYS.MATCHES)
            if (cached) {
                setMatches(cached)
                toast.info("Showing cached match suggestions", {
                    id: "matches-cache",
                })
            } else {
                setMatches(MOCK_MATCHES)
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMatches()
    }, [fetchMatches])

    if (isLoading && matches.length === 0) {
        return <SuggestionsSidebarSkeleton className={className} />
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Match Activity Card */}
            <MatchActivityCard />

            {/* Smart Matches Card */}
            <GlassCard>
                <div className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 border-b border-white/[0.06]">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Smart Matches
                        <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-xs md:text-[10px] font-bold bg-primary text-primary-foreground ml-1"
                        >
                            ✨ AI
                        </Badge>
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                        See All
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
                <div className="p-4 md:p-5 pt-3 md:pt-4">
                    {matches.length === 0 ? (
                        /* Empty State */
                        <div className="py-8 text-center">
                            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Inbox className="h-6 w-6 text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">
                                No matches yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Complete your profile to unlock AI-powered recommendations.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="group flex flex-col gap-3 p-3 md:p-4 rounded-xl hover:bg-white/[0.04] transition-all duration-200 border border-transparent hover:border-white/[0.06]"
                                >
                                    {/* Header with Avatar & Match % */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                                                <AvatarImage
                                                    src={match.avatar}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                                    {match.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-semibold text-foreground truncate leading-none mb-1">
                                                    {match.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate leading-tight">
                                                    {match.role}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Match Percentage Badge */}
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-2xl font-bold text-primary leading-none">
                                                {match.matchPercentage}%
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                                                Match
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reason Badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {match.reasons.map((reason, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className={cn(
                                                    "text-xs px-2.5 py-0.5 font-medium border",
                                                    getReasonColor(reason.type)
                                                )}
                                            >
                                                {reason.label}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {/* View Match - Outlined (secondary) */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 flex-1 px-3 rounded-md text-sm font-medium hover:bg-muted border-border"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Match
                                        </Button>
                                        {/* Connect - Filled (primary) */}
                                        <Button
                                            size="sm"
                                            className="h-8 flex-1 px-3 rounded-md text-sm font-medium shadow-sm hover:shadow-md"
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Connect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Profile Strength Indicator */}
                    <div className="mt-6 mb-2">
                        <GlassCard innerClassName="p-5 md:p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm text-foreground">
                                    Profile Strength
                                </h4>
                                <span className="text-sm font-bold text-primary">72%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                                    style={{ width: "72%" }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                Complete your profile to get better{" "}
                                <span className="font-medium text-foreground">
                                    AI-powered matches
                                </span>
                            </p>
                            <Button 
                                variant="outline" 
                                className="w-full transition-all group font-medium border-primary/20 hover:border-primary hover:bg-primary/5"
                            >
                                Complete Profile
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}

export function SuggestionsSidebarSkeleton({
    className,
}: {
    className?: string
}) {
    return (
        <div className={cn("space-y-6", className)}>
            <GlassCard innerClassName="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col gap-3 py-2 border-b last:border-0"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 flex-1" />
                        </div>
                    </div>
                ))}
            </GlassCard>
        </div>
    )
}
