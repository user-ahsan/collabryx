"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserPlus, Sparkles, MapPin, MessageSquare, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import { startConversationAction } from "@/lib/actions/conversations.server"
import { WhyMatchModal } from "./why-match-modal"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { formatInitials } from "@/lib/utils/format-initials"
import { getScoreColorClasses } from "@/lib/services/match-scores"

interface MatchCardProps {
    match: {
        id: string
        profileId: string
        name: string
        role: string
        avatar: string
        compatibility: number
        skills: string[]
        interests: string[]
        bio: string
        location?: string
        timezone?: string
        availability?: "full-time" | "part-time" | "side-project"
        collaborationReadiness?: string
        insights?: {
            type: "complementary" | "shared" | "similar"
            text: string
        }[]
        aiConfidence?: number
        aiExplanation?: string
        reasons?: string[]
    }
    index?: number
    isNew?: boolean
}

const collaborationLabels: Record<string, { label: string; className: string }> = {
    available: {
        label: "Available now",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    open: {
        label: "Open to offers",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    },
    "not-available": {
        label: "Not available",
        className: "bg-muted/50 text-muted-foreground border-border/40"
    }
}

export const MatchCard = React.memo(function MatchCard({ match, index = 0, isNew = false }: MatchCardProps) {
    const router = useRouter()
    const [whyModalOpen, setWhyModalOpen] = useState(false)
    const [requestSent, setRequestSent] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [messageLoading, setMessageLoading] = useState(false)

    const handleMessage = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (messageLoading) return
        setMessageLoading(true)
        try {
            const formData = new FormData()
            formData.append("participant_id", match.profileId)
            const result = await startConversationAction(formData)
            if (result?.data?.id) {
                router.push(`/messages/${result.data.id}`)
            }
        } catch {
            // fallback: navigate to messages page if action fails
            router.push(`/messages`)
        } finally {
            setMessageLoading(false)
        }
    }

    const isStrongMatch = match.compatibility >= 90
    const scoreColors = getScoreColorClasses(match.compatibility)
    const collab = collaborationLabels[match.collaborationReadiness || "available"] || collaborationLabels.available
    const hasBio = match.bio && match.bio.trim().length > 0
    const hasLocation = match.location && match.location.trim().length > 0
    const hasSkills = match.skills && match.skills.length > 0

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
                        "bg-card border-border"
                    )}
                    innerClassName="h-full cursor-pointer flex flex-col"
                    onClick={() => router.push(`/profile/${match.profileId}`)}
                >
                    <div className="flex flex-col h-full">
                        {/* Banner - subtle gradient cover */}
                        <div className="relative h-[100px] bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent rounded-t-xl shrink-0">
                            {isNew && (
                                <Badge
                                    variant="default"
                                    className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold shadow-sm z-10"
                                >
                                    New
                                </Badge>
                            )}
                        </div>

                        {/* Avatar - centered, overlapping banner */}
                        <div className="flex justify-center -mt-10 mb-1 shrink-0">
                            <div className="relative">
                                <div className="relative rounded-full ring-4 ring-background transition-all duration-300 group-hover:ring-primary/30">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={match.avatar} alt={match.name} className="object-cover" />
                                        <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                                            {formatInitials(match.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {isStrongMatch && (
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 backdrop-blur-sm">
                                        <span className="text-[10px]">🔥</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex flex-col flex-1 px-4 pb-4">
                            {/* Name + Role - centered */}
                            <div className="text-center mb-2.5">
                                <h3 className="text-base font-bold tracking-tight text-foreground truncate">
                                    {match.name}
                                </h3>
                                <p className="text-sm text-foreground/70 truncate font-medium">
                                    {match.role}
                                </p>
                            </div>

                            {/* Location + Status - centered row */}
                            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                                {hasLocation && (
                                    <span className="inline-flex items-center gap-1 text-xs text-foreground/60">
                                        <MapPin className="h-3 w-3" />
                                        {match.location}
                                    </span>
                                )}
                                <Badge className={cn("text-[10px] px-2 py-0 border", collab.className)}>
                                    {collab.label}
                                </Badge>
                            </div>

                            {/* Match Score - clean card, no glow */}
                            <div className="mb-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Match
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setWhyModalOpen(true)
                                        }}
                                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                    >
                                        <span className={cn("text-lg font-bold leading-none", scoreColors.text)}>
                                            {match.compatibility}%
                                        </span>
                                    </button>
                                </div>
                                <div className="mt-2 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", scoreColors.progress)}
                                        style={{ width: `${match.compatibility}%` }}
                                    />
                                </div>
                            </div>

                            {/* Insights from match reasons */}
                            {match.reasons && match.reasons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {match.reasons.some(r => r.toLowerCase().includes('skill gap') || r.toLowerCase().includes('complement') || r.toLowerCase().includes('cross-domain')) ? (
                                        <MatchReasonBadge
                                            type="complementary"
                                            label="Complementary"
                                            className="text-[10px] py-0 px-2"
                                        />
                                    ) : (
                                        <MatchReasonBadge
                                            type="skill"
                                            label={match.reasons[0]}
                                            className="text-[10px] py-0 px-2"
                                        />
                                    )}
                                    {match.reasons.length > 1 && (
                                        <span className="text-[10px] text-foreground/50 flex items-center">+{match.reasons.length - 1}</span>
                                    )}
                                </div>
                            )}

                            {/* Skills - max 3, compact */}
                            {hasSkills && (
                                <div className="mb-2">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {match.skills.slice(0, 3).map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5 font-medium",
                                                    glass("badge"),
                                                    "hover:bg-primary/10 hover:text-primary transition-colors"
                                                )}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                        {match.skills.length > 3 && (
                                            <span className="text-[10px] text-foreground/50">+{match.skills.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bio - 2 lines max */}
                            {hasBio ? (
                                <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                                    {match.bio}
                                </p>
                            ) : (
                                <p className="text-xs text-foreground/40 italic line-clamp-2 leading-relaxed">
                                    No bio yet
                                </p>
                            )}

                            {/* Spacer + Actions at bottom */}
                            <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-border/40">
                                {/* Primary action row */}
                                <div className="flex gap-2 items-center">
                                    {!requestSent ? (
                                        <Button
                                            className={cn(
                                                "flex-1 h-9 text-xs font-medium",
                                                glass("buttonPrimary")
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

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={handleMessage}
                                        disabled={messageLoading}
                                    >
                                        <MessageSquare className={cn("h-3.5 w-3.5", messageLoading && "animate-pulse")} />
                                    </Button>

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

                                {/* Build Startup Plan button */}
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full h-8 text-xs font-medium transition-all",
                                        "border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40",
                                        glass("buttonGhost")
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/ai-mentor?collaborate=${match.profileId}`)
                                    }}
                                >
                                    <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                                    Build Startup Plan Together
                                </Button>
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
})
