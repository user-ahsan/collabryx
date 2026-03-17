"use client"

import { useState, useMemo } from "react"
import { MatchCard } from "@/components/features/matches/match-card"
import { MatchCardListView } from "@/components/features/matches/match-card-list-view"
import { MatchCardSkeleton, MatchCardListViewSkeleton } from "@/components/features/matches/match-card-skeleton"
import { MatchContextHeader } from "@/components/features/matches/match-context-header"
import { MatchFilters } from "@/components/features/matches/match-filters"
import { toast } from "sonner"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMatches } from "@/hooks/use-matches-query"
import { getCache, CACHE_KEYS } from "@/lib/dashboard-cache"

type ViewMode = "grid" | "list"

// UI-compatible match type for component
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

export function MatchesClient() {
    // Fetch matches with React Query
    const { data: matchesData, isPending, error } = useMatches({ limit: 20 })

    // Map to UI format with stable reference, fallback to cache if needed
    const matches: UIMatch[] = useMemo(() => {
        // If we have data from React Query, use it
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
        
        // If error and no data, try cache
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
        // Simulate "finding people" logic
        toast("Preferences Updated", {
            description: `Looking for ${newPrefs.role} in ${newPrefs.industry}...`,
        })
    }

    return (
        <div className="w-full min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
                {/* Header Section */}
                <MatchContextHeader
                    preferences={preferences}
                    onUpdatePreferences={handleUpdatePreferences}
                    matchCount={matches.length}
                />

                {/* Filter Bar */}
                <MatchFilters
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Grid or List Layout */}
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
                        <Button
                            variant="default"
                            onClick={() => handleUpdatePreferences({ role: "Any", industry: "Any", type: "Any" })}
                        >
                            Reset Preferences
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 pb-20">
                        {matches.map((match, index) => (
                            <div
                                key={match.id}
                                style={{ 
                                    animationDelay: `${index * 75}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <MatchCard match={match} index={index} />
                            </div>
                        ))}
                    </div>
                ) : viewMode === "list" ? (
                    <div className="flex flex-col gap-4 md:gap-6 pb-20">
                        {matches.map((match, index) => (
                            <div
                                key={match.id}
                                style={{ 
                                    animationDelay: `${index * 50}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <MatchCardListView match={match} index={index} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-20">
                        {matches.map((match, index) => (
                            <div
                                key={match.id}
                                style={{ 
                                    animationDelay: `${index * 50}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <MatchCardListView match={match} index={index} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
