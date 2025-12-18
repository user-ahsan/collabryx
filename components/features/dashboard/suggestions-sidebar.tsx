"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, ArrowRight, UserPlus, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchReason {
    type: 'skill' | 'interest' | 'availability'
    label: string
}

interface MatchSuggestion {
    id: string
    name: string
    role: string
    avatar: string
    initials: string
    matchPercentage: number
    reasons: MatchReason[]
}

interface MatchIntelligencePanelProps {
    className?: string
    matches?: MatchSuggestion[]
}

const DEFAULT_MATCHES: MatchSuggestion[] = [
    {
        id: "1",
        name: "Sarah Miller",
        role: "Marketing Lead",
        matchPercentage: 91,
        avatar: "/avatars/02.png",
        initials: "SM",
        reasons: [
            { type: 'skill', label: 'Complementary Skills' },
            { type: 'interest', label: 'Shared Interest: Startups' }
        ]
    },
    {
        id: "2",
        name: "David Chen",
        role: "Full Stack Developer",
        matchPercentage: 87,
        avatar: "/avatars/03.png",
        initials: "DC",
        reasons: [
            { type: 'interest', label: 'Shared Interest: Fintech' },
            { type: 'availability', label: 'Similar Availability' }
        ]
    },
    {
        id: "3",
        name: "Emily Zhang",
        role: "UX Researcher",
        matchPercentage: 84,
        avatar: "/avatars/04.png",
        initials: "EZ",
        reasons: [
            { type: 'skill', label: 'Needs Tech Co-Founder' },
            { type: 'interest', label: 'Building MVP' }
        ]
    }
]

const getReasonColor = (type: MatchReason['type']) => {
    switch (type) {
        case 'skill':
            return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
        case 'interest':
            return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900'
        case 'availability':
            return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
    }
}

export function SuggestionsSidebar({
    className,
    matches = DEFAULT_MATCHES
}: MatchIntelligencePanelProps) {
    return (
        <Card className={cn("shadow-sm border bg-card sticky top-6 overflow-hidden", className)}>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Smart Matches
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-primary text-primary-foreground ml-1">
                        ✨ AI
                    </Badge>
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                >
                    See All
                    <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-3">
                <div className="space-y-3">
                    {matches.map((match) => (
                        <div
                            key={match.id}
                            className="group flex flex-col gap-3 p-3 rounded-xl hover:bg-muted transition-all duration-200 border border-transparent hover:border-border"
                        >
                            {/* Header with Avatar & Match % */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                                        <AvatarImage src={match.avatar} className="object-cover" />
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                            {match.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground truncate leading-none mb-1">
                                            {match.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate leading-tight">
                                            {match.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Match Percentage Badge */}
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="text-2xl font-bold text-primary leading-none">
                                        {match.matchPercentage}%
                                    </span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-medium">
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
                                            "text-[10px] px-2 py-0.5 font-medium border",
                                            getReasonColor(reason.type)
                                        )}
                                    >
                                        {reason.label}
                                    </Badge>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 flex-1 px-2 rounded-md text-xs font-medium hover:bg-muted border-border"
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Match
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 flex-1 px-2 rounded-md text-xs font-medium"
                                >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Connect
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 mb-2">
                    <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                            <span className="text-xl">🚀</span>
                            Want more matches?
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Complete your profile to unlock <span className="font-medium text-foreground">AI-powered recommendations</span> tailored just for you.
                        </p>
                        <Button className="w-full shadow-md transition-all group font-semibold">
                            Complete Profile
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
