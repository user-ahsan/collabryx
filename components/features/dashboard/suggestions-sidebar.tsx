"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, UserPlus, Eye, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { fetchMatches } from "@/lib/services/matches"
import { TOAST_MESSAGES, TOAST_IDS } from "@/lib/constants/toast-messages"
import { MatchActivityCard } from "./match-activity-card"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MatchIntelligencePanelProps {
    className?: string
}

interface MatchReason {
    type: "skill" | "interest" | "availability"
    label: string
}

interface UIMatchSuggestion {
    id: string
    name: string
    role: string
    avatar: string
    initials: string
    matchPercentage: number
    reasons: MatchReason[]
}



export function SuggestionsSidebar({ className }: MatchIntelligencePanelProps) {
    const [matches, setMatches] = useState<UIMatchSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
    const router = useRouter()

    // Fetch profile to check onboarding status
    const fetchProfileStatus = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", user.id)
                .single()
            
            setOnboardingCompleted(profile?.onboarding_completed ?? false)
        } else {
            setOnboardingCompleted(true)
        }
    }, [])

    useEffect(() => {
        fetchProfileStatus()
    }, [fetchProfileStatus])

    const handleCompleteProfile = () => {
        router.push("/onboarding")
    }

    // ── API → Cache → Hardcoded Fallback ──
    const fetchMatchesData = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await fetchMatches({ limit: 5 })

            if (error) throw error

            if (data && data.length > 0) {
                // Create a UI-friendly type that combines match suggestion with profile info
                const mapped = data.map((match) => ({
                    id: match.id,
                    name: match.matched_user_name ?? "Unknown",
                    role: match.matched_user_role ?? "",
                    avatar: match.matched_user_avatar ?? "",
                    initials: match.matched_user_initials ?? "U",
                    matchPercentage: match.match_percentage,
                    reasons: Array.isArray(match.reasons)
                        ? match.reasons.map((r: unknown) => {
                            if (typeof r === "string") {
                                return { type: "skill" as const, label: r }
                            }
                            if (typeof r === "object" && r !== null && "type" in r && "label" in r) {
                                return {
                                    type: (r as { type: string }).type as "skill" | "interest" | "availability",
                                    label: (r as { label: string }).label,
                                }
                            }
                            return { type: "skill" as const, label: String(r) }
                        })
                        : [],
                }))
                setMatches(mapped)
                setCache(CACHE_KEYS.MATCHES, mapped)
            }
        } catch {
            logger.app.error('Failed to fetch matches', {
                error: error instanceof Error ? error.message : String(error),
                limit: 5
            })
            const cached = getCache<UIMatchSuggestion[]>(CACHE_KEYS.MATCHES)
            if (cached) {
                setMatches(cached)
                toast.info(TOAST_MESSAGES.MATCHES.CACHE, { id: TOAST_IDS.MATCHES })
            } else {
                toast.error('Unable to load matches')
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMatchesData()
    }, [fetchMatchesData])

    if (isLoading && matches.length === 0) {
        return <SuggestionsSidebarSkeleton className={className} />
    }

    // Show skeleton for profile status while loading
    if (onboardingCompleted === null) {
        return (
            <div className={cn("space-y-4", className)}>
                <MatchActivityCard />
                <GlassCard>
                    <div className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 border-b border-white/[0.06]">
                        <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Smart Matches
                        </h3>
                    </div>
                    <div className="p-4 md:p-5 pt-3 md:pt-4 space-y-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </GlassCard>
            </div>
        )
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

                                    {/* Reason Badges - Using MatchReasonBadge with glass variants */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {match.reasons.map((reason, index) => (
                                            <MatchReasonBadge
                                                key={index}
                                                type={reason.type}
                                                label={reason.label}
                                            />
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {/* View Match - Ghost button with glass variant */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={cn(
                                                "h-8 flex-1 px-3 rounded-md text-sm font-medium",
                                                glass("buttonGhost")
                                            )}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Match
                                        </Button>
                                        {/* Connect - Primary with glass glow effect */}
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "h-8 flex-1 px-3 rounded-md text-sm font-medium",
                                                glass("buttonPrimary"),
                                                glass("buttonPrimaryGlow")
                                            )}
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Connect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Profile Strength Indicator - Only show if onboarding NOT completed */}
                    {onboardingCompleted === false && (
                        <div className="mt-6 mb-2">
                            <GlassCard innerClassName="p-5 md:p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm text-foreground">
                                        Complete Your Profile
                                    </h4>
                                    <span className="text-sm font-bold text-amber-500">Incomplete</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                    Complete your profile to unlock{" "}
                                    <span className="font-medium text-foreground">
                                        AI-powered matches
                                    </span>{" "}
                                    and get better collaboration opportunities.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="w-full transition-all group font-medium border-primary/20 hover:border-primary hover:bg-primary/5"
                                    onClick={handleCompleteProfile}
                                >
                                    Complete Profile
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </GlassCard>
                        </div>
                    )}
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
