"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchScoreCompact } from "@/components/shared/match-score"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    const router = useRouter()
    const [isSaved, setIsSaved] = useState(false)
    const [requestSent, setRequestSent] = useState(false)

    const isStrongMatch = match.compatibility >= 90

    // Combine location and availability for a clean subtitle
    const subtitleParts = []
    if (match.location) subtitleParts.push(match.location)
    if (match.availability) subtitleParts.push(availabilityLabels[match.availability])
    const subtitle = subtitleParts.join(" • ")

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                className="group"
            >
                <GlassCard
                    hoverable
                    className="p-3 sm:p-4 cursor-pointer"
                    onClick={() => router.push(`/profile/${match.id}`)}
                >
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

                            {/* Location & Availability Subtitle */}
                            {subtitle && (
                                <p className="text-[11px] text-muted-foreground/80 mb-2 truncate">
                                    {subtitle}
                                </p>
                            )}

                            {/* Tags: 2 Skills & 1 Insight for minimalism */}
                            <div className="flex flex-col gap-1.5 mb-1.5">
                                {match.insights && match.insights.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        <MatchReasonBadge
                                            type={match.insights[0].type === "complementary" ? "complementary" : match.insights[0].type === "shared" ? "interest" : "skill"}
                                            label={match.insights[0].text}
                                            className="text-[10px] py-0 px-2"
                                        />
                                        {match.insights.length > 1 && (
                                            <span className="text-[10px] text-muted-foreground/60 flex items-center">+{match.insights.length - 1}</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1 items-center">
                                    {match.skills.slice(0, 2).map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="bg-muted/40 text-muted-foreground text-[10px] px-2 py-0 font-medium"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                    {match.skills.length > 2 && (
                                        <TooltipProvider delayDuration={300}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium border-dashed text-muted-foreground/70 cursor-help">
                                                        +{match.skills.length - 2}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[200px] text-xs">
                                                    <p>{match.skills.slice(2).join(", ")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Match Score - Top Right */}
                        <div className="shrink-0 hidden sm:block">
                            <MatchScoreCompact overall={match.compatibility} horizontal />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 sm:flex-col lg:flex-row mt-3 sm:mt-0 w-full sm:w-auto overflow-hidden">
                            {!requestSent ? (
                                <Button
                                    size="sm"
                                    className="h-[36px] min-h-[36px] text-xs font-medium w-full sm:w-[110px] flex-1 sm:flex-none"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setRequestSent(true)
                                    }}
                                >
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                    Connect
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-[36px] min-h-[36px] text-xs w-full sm:w-[110px] flex-1 sm:flex-none bg-emerald-500/10 text-emerald-500 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-emerald-500/20 group/cancel transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setRequestSent(false)
                                    }}
                                >
                                    <span className="group-hover/cancel:hidden flex items-center justify-center w-full">Request Sent</span>
                                    <span className="hidden group-hover/cancel:flex items-center justify-center w-full">Cancel</span>
                                </Button>
                            )}

                            <div className="shrink-0 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                                <MatchCardDropdown
                                    isSaved={isSaved}
                                    onSave={() => setIsSaved(!isSaved)}
                                    onViewProfile={() => router.push(`/profile/${match.id}`)}
                                    onReport={() => { }}
                                    onCopyLink={() => navigator.clipboard.writeText(window.location.href)}
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </>
    )
}
