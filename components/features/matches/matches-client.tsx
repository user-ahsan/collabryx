"use client"

import { useState, useMemo, useRef } from "react"
import * as React from "react"
import { MatchCard } from "@/components/features/matches/match-card"
import { MatchCardListView } from "@/components/features/matches/match-card-list-view"
import { MatchCardSkeleton, MatchCardListViewSkeleton } from "@/components/features/matches/match-card-skeleton"
import { MatchContextHeader } from "@/components/features/matches/match-context-header"
import { MatchFilters } from "@/components/features/matches/match-filters"
import { toast } from "sonner"
import { Users, Sparkles, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { useMatches, useGenerateMatches } from "@/hooks/use-matches-query"
import { getCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { useAuth } from "@/hooks/use-auth"
import { logger } from "@/lib/logger"

type ViewMode = "grid" | "list"
type SortOption = "compatibility" | "name" | "role"

interface UIMatch {
    id: string
    profileId: string
    name: string
    role: string
    avatar: string
    compatibility: number
    skills: string[]
    interests: string[]
    bio: string
    location: string
    timezone: string
    availability: "full-time" | "part-time" | "side-project"
    collaborationReadiness: string
    insights: Array<{ type: "complementary" | "shared" | "similar"; text: string }>
    aiConfidence?: number
    aiExplanation?: string
    reasons?: string[]
}

interface MatchCardErrorBoundaryProps {
    children: React.ReactNode
    matchId: string
}

function MatchCardErrorBoundary({ children, matchId }: MatchCardErrorBoundaryProps) {
    const [hasError, setHasError] = useState(false)

    // Use effect to catch render errors by checking children validity
    React.useEffect(() => {
        try {
            // Attempt to render children to check for errors
            if (children && typeof children === 'object' && 'type' in children) {
                // Valid React element
            }
        } catch (error) {
            logger.app.error("Failed to render match card", {
                matchId,
                error: error instanceof Error ? error.message : String(error),
            })
            setHasError(true)
        }
    }, [children, matchId])

    if (hasError) {
        return (
            <GlassCard className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Unable to load this match</p>
            </GlassCard>
        )
    }
    return <>{children}</>
}

function renderMatchCard(match: UIMatch, index: number, viewMode: ViewMode, isNew: boolean) {
    try {
        const card = viewMode === "grid" 
            ? <MatchCard match={match} index={index} isNew={isNew} />
            : <MatchCardListView match={match} index={index} />
        return (
            <div
                key={match.id}
                style={{ 
                    animationDelay: `${index * (viewMode === "grid" ? 75 : 50)}ms`,
                    animationFillMode: 'backwards'
                }}
            >
                <MatchCardErrorBoundary matchId={match.id}>
                    {card}
                </MatchCardErrorBoundary>
            </div>
        )
    } catch (error) {
        logger.app.error("Failed to render match card", {
            matchId: match.id,
            error: error instanceof Error ? error.message : String(error),
        })
        return (
            <GlassCard
                key={match.id}
                className="p-4 text-center"
            >
                <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Unable to load this match</p>
            </GlassCard>
        )
    }
}

export function MatchesClient() {
    const { data: matchesData, isPending, error } = useMatches({ limit: 20 })
    const generateMatchesMutation = useGenerateMatches()
    const { user } = useAuth()

    const matches: UIMatch[] = useMemo(() => {
        if (matchesData && matchesData.length > 0) {
            return matchesData.map((match) => {
                const reasonTexts: Array<{ type: "complementary" | "shared" | "similar"; text: string }> = []
                const reasons = match.reasons || []
                if (Array.isArray(reasons)) {
                    for (const reason of reasons) {
                        if (typeof reason === "string") {
                            if (reason.toLowerCase().includes("skill")) {
                                reasonTexts.push({ type: "similar", text: reason })
                            } else if (reason.toLowerCase().includes("complement")) {
                                reasonTexts.push({ type: "complementary", text: reason })
                            } else if (reason.toLowerCase().includes("interest") || reason.toLowerCase().includes("shared")) {
                                reasonTexts.push({ type: "shared", text: reason })
                            } else {
                                reasonTexts.push({ type: "similar", text: reason })
                            }
                        }
                    }
                }
                if (reasonTexts.length === 0) {
                    reasonTexts.push({ type: "complementary", text: "Matches your skills" })
                }

                return {
                    id: match.id,
                    profileId: match.matched_user_id,
                    name: match.matched_user_name ?? "Unknown",
                    role: match.matched_user_role ?? "",
                    avatar: match.matched_user_avatar ?? "/avatars/01.png",
                    compatibility: match.match_percentage,
                    skills: match.matched_user_skills || [],
                    interests: match.matched_user_interests || [],
                    bio: match.matched_user_bio ?? "",
                    location: match.matched_user_location ?? "",
                    timezone: "PST",
                    availability: "full-time" as const,
                    collaborationReadiness: match.matched_user_collaboration ?? "available",
                    insights: reasonTexts,
                    aiConfidence: match.ai_confidence,
                    aiExplanation: match.ai_explanation,
                    reasons: Array.isArray(match.reasons) ? match.reasons.map(r => String(r)) : [],
                }
            })
        }
        if (error) {
            const cached = getCache<UIMatch[]>(CACHE_KEYS.MATCHES)
            if (cached) {
                return cached
            }
        }
        return []
    }, [matchesData, error])

    // Extract unique skills from all fetched matches for the filter dropdown
    const allSkills = useMemo(() => {
        const skillSet = new Set<string>()
        for (const m of matches) {
            for (const s of m.skills) {
                skillSet.add(s)
            }
        }
        return Array.from(skillSet).sort()
    }, [matches])

    const [selectedSkill, setSelectedSkill] = useState("")
    const [sortBy, setSortBy] = useState<SortOption>("compatibility")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [newProfileIds, setNewProfileIds] = useState<Set<string>>(new Set())
    const preGenProfileIds = useRef<Set<string>>(new Set())

    // Filter + sort matches
    const filteredMatches = useMemo(() => {
        let result = matches

        // Filter by skill
        if (selectedSkill) {
            result = result.filter((m) => m.skills.includes(selectedSkill))
        }

        // Sort
        const sorted = [...result]
        switch (sortBy) {
            case "compatibility":
                sorted.sort((a, b) => b.compatibility - a.compatibility)
                break
            case "name":
                sorted.sort((a, b) => a.name.localeCompare(b.name))
                break
            case "role":
                sorted.sort((a, b) => a.role.localeCompare(b.role))
                break
        }
        return sorted
    }, [matches, selectedSkill, sortBy])

    const handleGenerateMatches = async () => {
        if (!user) {
            toast.error("Authentication required", {
                description: "Please log in to generate matches",
            })
            return
        }

        // Snapshot current profile IDs so we can detect new matches
        preGenProfileIds.current = new Set(matches.map((m) => m.profileId))

        try {
            const result = await generateMatchesMutation.mutateAsync({
                userId: user.id,
                limit: 20,
            })

            // Mark newly generated matches using the API response
            if (result && result.length > 0) {
                const newIds = new Set<string>()
                for (const m of result) {
                    if (!preGenProfileIds.current.has(m.matched_user_id)) {
                        newIds.add(m.matched_user_id)
                    }
                }
                if (newIds.size > 0) {
                    setNewProfileIds(newIds)
                }
            }
        } catch (error) {
            console.error("Match generation failed:", error)
        }
    }

    return (
        <div className="w-full min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
                <MatchContextHeader
                    matchCount={filteredMatches.length}
                    isGenerating={generateMatchesMutation.isPending}
                    onGenerateMatches={handleGenerateMatches}
                />
                <MatchFilters
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    skills={allSkills}
                    selectedSkill={selectedSkill}
                    onSkillChange={setSelectedSkill}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />
                {isPending ? (
                    viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-20">
                        <MatchCardSkeleton count={8} />
                    </div>
                    ) : (
                    <div className="flex flex-col gap-4 md:gap-6 pb-20">
                        <MatchCardListViewSkeleton count={5} />
                    </div>
                    )
                ) : error && matches.length === 0 ? (
                    <GlassCard className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 sm:mb-6">
                            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            Unable to load matches
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6">
                            Please check your connection and try again.
                        </p>
                    </GlassCard>
                ) : matches.length === 0 ? (
                    <GlassCard className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            No matches found yet
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6">
                            Generate matches to discover collaborators who complement your skills and goals.
                        </p>
                        <Button
                            variant="default"
                            onClick={handleGenerateMatches}
                            disabled={generateMatchesMutation.isPending}
                        >
                            {generateMatchesMutation.isPending ? (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Matches
                                </>
                            )}
                        </Button>
                    </GlassCard>
                ) : filteredMatches.length === 0 ? (
                    <GlassCard className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
                            <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            No matches match this filter
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6">
                            Try selecting a different skill or clearing the filter to see all matches.
                        </p>
                        <Button variant="outline" onClick={() => { setSelectedSkill(""); setSortBy("compatibility"); }}>
                            Clear Filters
                        </Button>
                    </GlassCard>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-20">
                        {filteredMatches.map((match, index) => renderMatchCard(match, index, viewMode, newProfileIds.has(match.profileId)))}
                    </div>
                ) : viewMode === "list" ? (
                    <div className="flex flex-col gap-4 md:gap-6 pb-20">
                        {filteredMatches.map((match, index) => renderMatchCard(match, index, viewMode, newProfileIds.has(match.profileId)))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-20">
                        {filteredMatches.map((match, index) => renderMatchCard(match, index, viewMode, newProfileIds.has(match.profileId)))}
                    </div>
                )}
            </div>
        </div>
    )
}
