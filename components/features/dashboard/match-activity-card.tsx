"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchActivity {
    id: string
    type: 'profile_view' | 'building_match' | 'skill_match'
    userName: string
    userAvatar: string
    userInitials: string
    matchPercentage: number
    activity: string
}

interface MatchActivityCardProps {
    activities?: MatchActivity[]
    className?: string
}

const DEFAULT_ACTIVITIES: MatchActivity[] = [
    {
        id: "1",
        type: "profile_view",
        userName: "Emily Zhang",
        userAvatar: "/avatars/04.png",
        userInitials: "EZ",
        matchPercentage: 84,
        activity: "viewed your profile"
    },
    {
        id: "2",
        type: "building_match",
        userName: "David Chen",
        userAvatar: "/avatars/03.png",
        userInitials: "DC",
        matchPercentage: 87,
        activity: "is building an MVP you may fit"
    }
]

export function MatchActivityCard({
    activities = DEFAULT_ACTIVITIES,
    className
}: MatchActivityCardProps) {
    if (activities.length === 0) return null

    return (
        <Card className={cn("border-l-4 border-l-primary bg-card shadow-sm", className)}>
            <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <Bell className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                New Match Activity
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Recent collaboration opportunities
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                        View All
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                <div className="space-y-2.5">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <Avatar className="h-9 w-9 border shadow-sm shrink-0">
                                <AvatarImage src={activity.userAvatar} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                    {activity.userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground">
                                    <span className="font-semibold">{activity.userName}</span>{" "}
                                    <span className="text-muted-foreground">{activity.activity}</span>
                                </p>
                                <p className="text-xs text-primary font-medium mt-0.5">
                                    {activity.matchPercentage}% match
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
