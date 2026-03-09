"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, MessageSquare, MapPin, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchScoreCompact } from "@/components/shared/match-score"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"

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
    insights?: Insight[]
    location?: string
    timezone?: string
    availability?: "full-time" | "part-time" | "side-project"
}

const availabilityLabels: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "side-project": "Side-project"
}

interface MatchCardListViewProps {
    match: Match
    index: number
}

export function MatchCardListView({ match, index }: MatchCardListViewProps) {
    const [isSaved, setIsSaved] = useState(false)
    const isStrongMatch = match.compatibility >= 90
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="group"
        >
            <GlassCard hoverable className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Avatar - Top Left */}
                    <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border border-border shrink-0">
                            <AvatarImage src={match.avatar} className="object-cover" />
                            <AvatarFallback className="text-sm font-bold bg-muted text-foreground">
                                {match.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        {isStrongMatch && (
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 backdrop-blur-sm">
                                <span className="text-[8px]">🔥</span>
                            </div>
                        )}
                    </div>

                    {/* Name, Role, Location, Skills, Insights - Middle */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Name & Role */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-bold text-sm sm:text-base truncate text-foreground">{match.name}</h3>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 shrink-0 bg-muted/50 text-muted-foreground border border-border">
                                {match.role}
                            </Badge>
                        </div>

                        {/* Location & Availability */}
                        {(match.location || match.availability) && (
                            <div className="flex items-center gap-3 mb-1.5 text-xs text-muted-foreground">
                                {match.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{match.location}</span>
                                        {match.timezone && <span className="text-muted-foreground/50">• {match.timezone}</span>}
                                    </div>
                                )}
                                {match.availability && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{availabilityLabels[match.availability]}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mb-1.5">
                            {match.skills.slice(0, 4).map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="bg-muted/50 text-muted-foreground text-[10px] px-2 py-0 font-medium"
                                >
                                    {skill}
                                </Badge>
                            ))}
                            {match.skills.length > 4 && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium border-dashed text-muted-foreground/70">
                                    +{match.skills.length - 4}
                                </Badge>
                            )}
                        </div>

                        {/* Insights - muted */}
                        {match.insights && match.insights.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {match.insights.slice(0, 2).map((insight, i) => (
                                    <MatchReasonBadge
                                        key={i}
                                        type={insight.type === "complementary" ? "complementary" : insight.type === "shared" ? "interest" : "skill"}
                                        label={insight.text}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Match Score - Top Right */}
                    <div className="shrink-0">
                        <MatchScoreCompact overall={match.compatibility} horizontal />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" className="h-8 text-xs">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Connect
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                        </Button>
                        <MatchCardDropdown
                            isSaved={isSaved}
                            onSave={() => setIsSaved(!isSaved)}
                            onViewProfile={() => {}}
                            onReport={() => {}}
                            onCopyLink={() => {}}
                        />
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}
