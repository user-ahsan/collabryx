"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Sparkles } from "lucide-react"

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
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Smart Matches
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {suggestions.map((person, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                            <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={person.avatar} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{person.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium leading-none truncate">{person.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{person.role}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{person.mutuals} mutual connections</p>
                                <Button variant="outline" size="sm" className="h-7 w-full mt-3 text-xs font-medium bg-background hover:bg-primary hover:text-primary-foreground transition-all">
                                    <Plus className="h-3 w-3 mr-1" /> Connect
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t bg-muted/10">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary">
                        View all matches
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
