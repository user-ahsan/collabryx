"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquare, UserPlus, MapPin, Clock } from "lucide-react"
import { useState } from "react"
import { WhyMatchModal } from "./why-match-modal"
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
    const [requestSent, setRequestSent] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const isStrongMatch = match.compatibility >= 90
    const isLowMatch = match.compatibility < 80

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
                        "group relative h-[280px] overflow-hidden transition-all duration-300",
                        isLowMatch ? "opacity-60" : ""
                    )}
                    innerClassName="h-full"
                >
                    <div className="flex flex-col h-full p-4">
                        {/* Top Row: Avatar | Name & Role | Match Score */}
                        <div className="flex items-start justify-between gap-3 mb-2">
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
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold tracking-tight text-foreground truncate">
                                    {match.name}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate">
                                    {match.role}
                                </p>
                            </div>

                            {/* Match Score - Top Right */}
                            <div 
                                className="shrink-0 cursor-pointer"
                                onClick={() => setWhyModalOpen(true)}
                            >
                                <MatchScoreCompact overall={match.compatibility} />
                                <p className="text-[9px] text-muted-foreground/60 text-center mt-0.5 hover:text-primary/70 transition-colors">
                                    View details
                                </p>
                            </div>
                        </div>

                        {/* Second Row: Location & Availability */}
                        {(match.location || match.availability) && (
                            <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
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

                        {/* Third Row: Skills Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
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

                        {/* Match Reason Badges - muted */}
                        {match.insights && match.insights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {match.insights.slice(0, 2).map((insight, i) => (
                                    <MatchReasonBadge
                                        key={i}
                                        type={insight.type === "complementary" ? "complementary" : insight.type === "shared" ? "interest" : "skill"}
                                        label={insight.text}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Fourth Row: Bio - 2 lines max */}
                        <div className="mb-auto overflow-hidden">
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                &ldquo;{match.bio}&rdquo;
                            </p>
                        </div>

                        {/* Bottom Row: Action Buttons */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                            {!requestSent ? (
                                <>
                                    <Button
                                        className="flex-1 h-8 text-xs"
                                        onClick={() => setRequestSent(true)}
                                    >
                                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                        Connect
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-8 text-xs"
                                    >
                                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                        Message
                                    </Button>
                                    <MatchCardDropdown
                                        isSaved={isSaved}
                                        onSave={() => setIsSaved(!isSaved)}
                                        onViewProfile={() => {}}
                                        onReport={() => {}}
                                        onCopyLink={() => {}}
                                    />
                                </>
                            ) : (
                                <Button
                                    disabled
                                    className="flex-1 h-8 text-xs cursor-not-allowed opacity-75 bg-green-600/20 text-green-400 border border-green-500/30"
                                >
                                    ⏳ Request Sent
                                </Button>
                            )}
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
        </>
    )
}
