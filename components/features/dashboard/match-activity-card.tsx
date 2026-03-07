"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
        <div className={cn(
            "relative rounded-xl md:rounded-2xl overflow-hidden",
            "bg-blue-950/[0.05] backdrop-blur-2xl",
            "border border-blue-400/10",
            "shadow-[0_4px_32px_0_rgba(59,130,246,0.06),0_1px_0_0_rgba(255,255,255,0.06)_inset]",
            "transition-all duration-500",
            className
        )}>
            {/* Top highlight streak */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none" />
            {/* Left edge highlight */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none" />
            {/* Blue ambient tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none" />

            <div className="p-4 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                            <Bell className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                New Match Activity
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Recent collaboration opportunities
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                        View All
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                {/* Activity Items */}
                <div className="space-y-1.5">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                        >
                            <Avatar className="h-9 w-9 border border-white/[0.08] shadow-sm shrink-0">
                                <AvatarImage src={activity.userAvatar} />
                                <AvatarFallback className="text-xs bg-blue-500/10 text-blue-400 font-bold">
                                    {activity.userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-snug">
                                    <span className="font-semibold">{activity.userName}</span>{" "}
                                    <span className="text-muted-foreground">{activity.activity}</span>
                                </p>
                                <p className="text-xs text-teal-400 font-medium mt-0.5">
                                    {activity.matchPercentage}% match
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
