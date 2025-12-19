"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, MessageSquare, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Insight {
    type: "complementary" | "shared" | "similar"
    text: string
}

interface Match {
    id: string
    name: string
    role: string
    avatar: string
    compatibility: number
    skills: string[]
    bio: string
    insights: Insight[]
}

interface MatchCardListViewProps {
    match: Match
    index: number
}

const getInsightColor = (type: Insight['type']) => {
    switch (type) {
        case 'complementary':
            return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
        case 'shared':
            return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900'
        case 'similar':
            return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
    }
}

export function MatchCardListView({ match, index }: MatchCardListViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="group bg-card border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-primary/30 transition-all"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Avatar & Basic Info */}
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/10 shrink-0">
                    <AvatarImage src={match.avatar} className="object-cover" />
                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {match.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>

                {/* Name & Role */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-bold text-sm sm:text-base truncate">{match.name}</h3>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 shrink-0">
                            {match.role}
                        </Badge>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                        {match.skills.slice(0, 4).map((skill) => (
                            <Badge
                                key={skill}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-medium"
                            >
                                {skill}
                            </Badge>
                        ))}
                        {match.skills.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                                +{match.skills.length - 4}
                            </Badge>
                        )}
                    </div>

                    {/* Insights */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {match.insights.map((insight, i) => (
                            <Badge
                                key={i}
                                variant="outline"
                                className={cn(
                                    "text-[10px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-medium border",
                                    getInsightColor(insight.type)
                                )}
                            >
                                {insight.text}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Match Score - Repositioned for mobile */}
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 w-full sm:w-auto sm:px-4 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/50">
                    <div className="text-2xl sm:text-3xl font-bold text-primary leading-none">
                        {match.compatibility}%
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium mt-1">
                        Match
                    </span>
                </div>

                {/* Actions - Mobile Horizontal, Desktop Vertical */}
                <div className="flex sm:flex-col gap-2 flex-1 sm:flex-none">
                    <Button size="sm" className="h-8 px-3 text-xs flex-1 sm:flex-none">
                        <UserPlus className="h-3 w-3 mr-1.5" />
                        Connect
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs flex-1 sm:flex-none">
                        <Eye className="h-3 w-3 mr-1.5" />
                        View
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
