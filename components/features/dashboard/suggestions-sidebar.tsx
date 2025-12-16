"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowRight, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
    id: string
    name: string
    role: string
    avatar: string
    initials: string
    mutuals?: number
}

interface SuggestionsSidebarProps {
    className?: string
    suggestions?: Suggestion[]
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
    {
        id: "1",
        name: "Sarah Miller",
        role: "Growth Marketing Lead",
        mutuals: 12,
        avatar: "/avatars/02.png",
        initials: "SM"
    },
    {
        id: "2",
        name: "David Chen",
        role: "Full Stack Developer",
        mutuals: 5,
        avatar: "/avatars/03.png",
        initials: "DC"
    },
    {
        id: "3",
        name: "Emily Zhang",
        role: "UX Researcher",
        mutuals: 8,
        avatar: "/avatars/04.png",
        initials: "EZ"
    }
]

export function SuggestionsSidebar({
    className,
    suggestions = DEFAULT_SUGGESTIONS
}: SuggestionsSidebarProps) {
    return (
        <Card className={cn("shadow-sm border-border/60 bg-card/60 backdrop-blur-xl sticky top-6 overflow-hidden", className)}>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                    <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/20" />
                    Smart Matches
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                >
                    See All
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-1">
                    {suggestions.map((person) => (
                        <div
                            key={person.id}
                            className="group flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-border/40"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-9 w-9 border border-border/50 shadow-sm shrink-0">
                                    <AvatarImage src={person.avatar} className="object-cover" />
                                    <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
                                        {person.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground truncate leading-none mb-1">
                                        {person.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate leading-tight">
                                        {person.role}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-full sm:w-auto px-3 rounded-md text-xs font-medium bg-background/50 hover:bg-primary hover:text-primary-foreground border-border/60 hover:border-primary/50 shadow-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            >
                                <UserPlus className="h-3 w-3 sm:mr-1.5" />
                                <span className="sm:inline">Connect</span>
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-primary/5 p-4">
                        <div className="text-center space-y-3">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">Want more matches?</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
                                    Complete your profile to unlock AI-powered recommendations.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="w-full h-8 rounded-lg text-xs shadow-none bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Complete Profile
                                <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
