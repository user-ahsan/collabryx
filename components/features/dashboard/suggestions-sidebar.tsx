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

                <div className="mt-6 mb-2">
                    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/20 p-5 shadow-sm">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-primary/20 blur-2xl rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-2 -ml-2 h-16 w-16 bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />

                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                            <span className="text-xl">🚀</span>
                            Want more matches?
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Complete your profile to unlock <span className="font-medium text-foreground">AI-powered recommendations</span> tailored just for you.
                        </p>
                        <Button className="w-full shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 group font-semibold">
                            Complete Profile
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
