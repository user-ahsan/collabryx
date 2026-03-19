"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserPlus, Sparkles, Brain } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WhyMatchModal } from "./why-match-modal"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchScoreCompact } from "@/components/shared/match-score"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { formatInitials } from "@/lib/utils/format-initials"
import { getScoreColorClasses, formatConfidence } from "@/lib/services/match-scores"

interface MatchCardProps {
    match: {
        id: string
        name: string
        role: string
        avatar: string
        compatibility: number
        skills: string[]
        bio: string
        location?: string
        timezone?: string
        availability?: "full-time" | "part-time" | "side-project"
        insights?: {
            type: "complementary" | "shared" | "similar"
            text: string
        }[]
        aiConfidence?: number
        aiExplanation?: string
    }
    index?: number
}

const availabilityLabels: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "side-project": "Side-project"
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
    const router = useRouter()
    const [whyModalOpen, setWhyModalOpen] = useState(false)
    const [requestSent, setRequestSent] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const isStrongMatch = match.compatibility >= 90
    const isLowMatch = match.compatibility < 80
    const scoreColors = getScoreColorClasses(match.compatibility)
    const hasHighConfidence = (match.aiConfidence || 0) >= 0.8

    // Combine location and availability for a clean subtitle
    const subtitleParts = []
    if (match.location) subtitleParts.push(match.location)
    if (match.availability) subtitleParts.push(availabilityLabels[match.availability])
    const subtitle = subtitleParts.join(" • ")

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
                className="h-full"
            >
                <GlassCard
                    hoverable
                    className={cn(
                        "group relative h-full overflow-hidden transition-all duration-300",
                        isLowMatch ? "opacity-60" : ""
                    )}
                    innerClassName="h-full cursor-pointer flex flex-col justify-between"
                    onClick={() => router.push(`/profile/${match.id}`)}
                >
                    <div className="flex flex-col h-full p-4">
                        {/* Top Row: Avatar | Name & Role | Match Score */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            {/* Avatar - Top Left */}
                            <div className="relative shrink-0">
                                <div className="relative rounded-full ring-1 ring-border transition-all duration-300 group-hover:ring-primary/50">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={match.avatar} alt={match.name} className="object-cover" />
                                        <AvatarFallback className="text-sm font-bold bg-muted text-foreground">
                                            {formatInitials(match.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {isStrongMatch && (
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 backdrop-blur-sm">
                                        <span className="text-[10px]">🔥</span>
                                    </div>
                                )}
                            </div>

                            {/* Name & Role - Middle */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                                <h3 className="text-sm font-bold tracking-tight text-foreground truncate">
                                    {match.name}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate font-medium">
                                    {match.role}
                                </p>
                            </div>

                            {/* Match Score - Top Right */}
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="shrink-0 z-10 flex items-center justify-center p-1 -mr-1 -mt-1 cursor-pointer hover:bg-white/5 rounded-md transition-colors min-h-[44px] min-w-[44px]"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setWhyModalOpen(true)
                                            }}
                                        >
                                            <MatchScoreCompact overall={match.compatibility} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className={cn("max-w-[220px]", scoreColors.bg, scoreColors.border)}>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className={cn("h-4 w-4", scoreColors.text)} />
                                                <span className={cn("text-xs font-bold", scoreColors.text)}>
                                                    {match.compatibility}% Match
                                                </span>
                                            </div>
                                            {match.aiConfidence && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                    <Brain className="h-3 w-3" />
                                                    <span>AI Confidence: {formatConfidence(match.aiConfidence)}</span>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-muted-foreground/80">
                                                Click to see detailed breakdown
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Location / Availability Subtitle */}
                        {subtitle && (
                            <p className="text-xs text-muted-foreground/80 mb-3 truncate">
                                {subtitle}
                            </p>
                        )}

                        {/* Bio Sneak Peek */}
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-3 leading-relaxed">
                            {match.bio}
                        </p>

                        {/* Minimalist Tags (2 skills, 1 insight) */}
                        <div className="flex flex-col gap-2 mb-auto">
                            {/* AI Confidence Badge for High-Confidence Matches */}
                            {hasHighConfidence && (
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-sm border",
                                        scoreColors.bg,
                                        scoreColors.text,
                                        scoreColors.border
                                    )}>
                                        <Sparkles className="h-3 w-3" />
                                        <span>AI-Powered Match</span>
                                    </div>
                                </div>
                            )}

                            {match.insights && match.insights.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    <MatchReasonBadge
                                        type={match.insights[0].type === "complementary" ? "complementary" : match.insights[0].type === "shared" ? "interest" : "skill"}
                                        label={match.insights[0].text}
                                        className="text-xs py-0 px-2"
                                    />
                                    {match.insights.length > 1 && (
                                        <span className="text-xs text-muted-foreground/60 flex items-center">+{match.insights.length - 1}</span>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 items-center">
                                {match.skills.slice(0, 2).map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                        className={cn(
                                            "text-xs px-2 py-0 font-medium",
                                            glass("badge")
                                        )}
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                                {match.skills.length > 2 && (
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                        "text-xs px-2 py-0 font-medium border-dashed cursor-help",
                                                        glass("badge")
                                                    )}
                                                >
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

                        {/* Bottom Row: Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 items-center">
                            {!requestSent ? (
                                <Button
                                    className={cn(
                                        "flex-1 h-9 text-xs font-medium",
                                        glass("buttonPrimary"),
                                        glass("buttonPrimaryGlow")
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setRequestSent(true)
                                    }}
                                >
                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                    Connect
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex-1 h-9 text-xs font-medium border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-colors",
                                        "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 group/cancel"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setRequestSent(false)
                                    }}
                                >
                                    <span className="group-hover/cancel:hidden flex items-center justify-center w-full">Request Sent</span>
                                    <span className="hidden group-hover/cancel:flex items-center justify-center w-full">Cancel Request</span>
                                </Button>
                            )}

                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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

            <WhyMatchModal
                open={whyModalOpen}
                onOpenChange={setWhyModalOpen}
                match={match}
            />
        </>
    )
}
