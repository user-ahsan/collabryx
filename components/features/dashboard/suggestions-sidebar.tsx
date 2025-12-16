"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Sparkles, ArrowRight } from "lucide-react"

export function SuggestionsSidebar() {
    const suggestions = [
        {
            name: "Sarah Miller",
            role: "Growth Marketing Lead",
            mutuals: 12,
            avatar: "/avatars/02.png",
            initials: "SM"
        },
        {
            name: "David Chen",
            role: "Full Stack Developer",
            mutuals: 5,
            avatar: "/avatars/03.png",
            initials: "DC"
        },
        {
            name: "Emily Zhang",
            role: "UX Researcher",
            mutuals: 8,
            avatar: "/avatars/04.png",
            initials: "EZ"
        }
    ]

    return (
        <Card className="shadow-sm border bg-card sticky top-6">
            <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary fill-primary/20" />
                    Smart Matches
                </CardTitle>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary font-semibold">
                    See All
                </Button>
            </CardHeader>
            <CardContent className="px-4 pb-6">
                <div className="space-y-4">
                    {suggestions.map((person, i) => (
                        <div key={i} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border/50">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarImage src={person.avatar} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{person.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{person.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" className="h-8 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none px-4 transition-all w-full">
                                        Connect
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 px-2">
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center space-y-2 border border-primary/10">
                        <p className="text-xs font-semibold text-foreground">Want more matches?</p>
                        <p className="text-[10px] text-muted-foreground leading-snug">Complete your profile to get better recommendations.</p>
                        <Button size="sm" variant="outline" className="w-full h-8 rounded-full text-xs mt-1 bg-background">
                            Complete Profile
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
