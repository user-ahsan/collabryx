"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserPlus } from "lucide-react"
import { useState } from "react"
import { WhyMatchModal } from "./why-match-modal"
import { MatchProfileDialog } from "./match-profile-dialog"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchScoreCompact } from "@/components/shared/match-score"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { cn } from "@/lib/utils"

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
    }
    index?: number
}

const availabilityLabels: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "side-project": "Side-project"
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
    const [whyModalOpen, setWhyModalOpen] = useState(false)
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [requestSent, setRequestSent] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const isStrongMatch = match.compatibility >= 90
    const isLowMatch = match.compatibility < 80

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
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                className="h-full"
            >
                <GlassCard
                    hoverable
                    className={cn(
                        "group relative h-[240px] overflow-hidden transition-all duration-300",
                        isLowMatch ? "opacity-60" : ""
                    )}
                    innerClassName="h-full cursor-pointer flex flex-col"
                    onClick={() => setProfileModalOpen(true)}
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
                                            {match.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {isStrongMatch && (
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 backdrop-blur-sm">
                                        <span className="text-[8px]">🔥</span>
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
                            <div
                                className="shrink-0 z-10"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setWhyModalOpen(true)
                                }}
                            >
                                <MatchScoreCompact overall={match.compatibility} />
                            </div>
                        </div>

                        {/* Location / Availability Subtitle */}
                        {subtitle && (
                            <p className="text-[11px] text-muted-foreground/80 mb-3 truncate">
                                {subtitle}
                            </p>
                        )}

                        {/* Minimalist Tags (2 skills, 1 insight) */}
                        <div className="flex flex-col gap-2 mb-auto">
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

                            <div className="flex flex-wrap gap-1.5">
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
                                    <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium border-dashed text-muted-foreground/70">
                                        +{match.skills.length - 2}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Bottom Row: Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 items-center">
                            {!requestSent ? (
                                <Button
                                    className="flex-1 h-8 text-xs font-medium"
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
                                    disabled
                                    className="flex-1 h-8 text-xs cursor-not-allowed opacity-75 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Request Sent
                                </Button>
                            )}

                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                <MatchCardDropdown
                                    isSaved={isSaved}
                                    onSave={() => setIsSaved(!isSaved)}
                                    onViewProfile={() => setProfileModalOpen(true)}
                                    onReport={() => { }}
                                    onCopyLink={() => navigator.clipboard.writeText(window.location.href)}
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Why Match Modal */}
            <WhyMatchModal
                open={whyModalOpen}
                onOpenChange={setWhyModalOpen}
                match={match}
            />

            {/* Profile Match Dialog */}
            <MatchProfileDialog
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
                match={match}
            />
        </>
    )
}
