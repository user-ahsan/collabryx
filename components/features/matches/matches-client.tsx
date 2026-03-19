"use client"

import { useState, useMemo } from "react"
import { MatchCard } from "@/components/features/matches/match-card"
import { MatchCardListView } from "@/components/features/matches/match-card-list-view"
import { MatchCardSkeleton, MatchCardListViewSkeleton } from "@/components/features/matches/match-card-skeleton"
import { MatchContextHeader } from "@/components/features/matches/match-context-header"
import { MatchFilters } from "@/components/features/matches/match-filters"
import { toast } from "sonner"
import { Users, Sparkles, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMatches, useGenerateMatches } from "@/hooks/use-matches-query"
import { getCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { useAuth } from "@/hooks/use-auth"
import { logger } from "@/lib/logger"

type ViewMode = "grid" | "list"

interface UIMatch {
    id: string
    name: string
    role: string
    avatar: string
    compatibility: number
    skills: string[]
    bio: string
    location: string
    timezone: string
    availability: "full-time" | "part-time" | "side-project"
    insights: Array<{ type: "complementary" | "shared" | "similar"; text: string }>
}

interface MatchCardErrorBoundaryProps {
    children: React.ReactNode
    matchId: string
}

function MatchCardErrorBoundary({ children, matchId }: MatchCardErrorBoundaryProps) {
    const [hasError, setHasError] = useState(false)
    try {
        if (hasError) {
            return (
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
                    <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Unable to load this match</p>
                </div>
            )
        }
        return <>{children}</>
    } catch (error) {
        logger.app.error("Failed to render match card", {
            matchId,
            error: error instanceof Error ? error.message : String(error),
        })
        setHasError(true)
        return null
    }
}

function renderMatchCard(match: UIMatch, index: number, viewMode: ViewMode) {
    try {
        const card = viewMode === "grid" 
            ? <MatchCard match={match} index={index} />
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
            <div
                key={match.id}
                className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center"
            >
                <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Unable to load this match</p>
            </div>
        )
    }
}

export function MatchesClient() {
    const { data: matchesData, isPending, error } = useMatches({ limit: 20 })
    const generateMatchesMutation = useGenerateMatches()
    const { user } = useAuth()

    const matches: UIMatch[] = useMemo(() => {
        if (matchesData && matchesData.length > 0) {
            return matchesData.map((match) => ({
                id: match.id,
                name: match.matched_user_name ?? "Unknown",
                role: match.matched_user_role ?? "",
                avatar: match.matched_user_avatar ?? "/avatars/01.png",
                compatibility: match.match_percentage,
                skills: [],
                bio: "",
                location: "",
                timezone: "PST",
                availability: "full-time" as const,
                insights: [
                    { type: "complementary" as const, text: "Matches your skills" },
                ],
            }))
        }
        if (error) {
            const cached = getCache<UIMatch[]>(CACHE_KEYS.MATCHES)
            if (cached) {
                return cached
            }
        }
        return []
    }, [matchesData, error])
    
    const [preferences, setPreferences] = useState({
        role: "CTO",
        industry: "Fintech",
        type: "Startup"
    })
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    const handleUpdatePreferences = (newPrefs: { role: string; industry: string; type: string }) => {
        setPreferences(newPrefs)
        toast("Preferences Updated", {
            description: `Looking for ${newPrefs.role} in ${newPrefs.industry}...`,
        })
    }

    const handleGenerateMatches = async () => {
        if (!user) {
            toast.error("Authentication required", {
                description: "Please log in to generate matches",
            })
            return
        }
        try {
            await generateMatchesMutation.mutateAsync({
                userId: user.id,
                limit: 20,
            })
        } catch (error) {
            console.error("Match generation failed:", error)
        }
    }

    return (
        <div className="w-full min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
                <MatchContextHeader
                    preferences={preferences}
                    onUpdatePreferences={handleUpdatePreferences}
                    matchCount={matches.length}
                />
                <MatchFilters
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
                {isPending ? (
                    viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 pb-20">
                        <MatchCardSkeleton count={8} />
                    </div>
                    ) : (
                    <div className="flex flex-col gap-4 md:gap-6 pb-20">
                        <MatchCardListViewSkeleton count={5} />
                    </div>
                    )
                ) : error && matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 sm:mb-6">
                            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            Unable to load matches
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6">
                            Please check your connection and try again.
                        </p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            No perfect matches found yet
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6">
                            We couldn&apos;t find anyone matching these exact criteria right now. Try broadening your preferences or check back later!
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleUpdatePreferences({ role: "Any", industry: "Any", type: "Any" })}
                            >
                                Reset Preferences
                            </Button>
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
                        </div>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 pb-20">
                        {matches.map((match, index) => renderMatchCard(match, index, viewMode))}
                    </div>
                ) : viewMode === "list" ? (
                    <div className="flex flex-col gap-4 md:gap-6 pb-20">
                        {matches.map((match, index) => renderMatchCard(match, index, viewMode))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-20">
                        {matches.map((match, index) => renderMatchCard(match, index, viewMode))}
                    </div>
                )}
            </div>
        </div>
    )
}
