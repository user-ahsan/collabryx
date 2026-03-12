"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, UserPlus, MessageSquare } from "lucide-react"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { MatchScore } from "@/components/shared/match-score"
import { MatchReasonBadge } from "@/components/ui/match-reason-badge"
import { formatInitials } from "@/lib/utils/format-initials"

interface MatchProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
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
}

const availabilityLabels: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "side-project": "Side-project"
}

export function MatchProfileDialog({ open, onOpenChange, match }: MatchProfileDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Using a similar glass style to glass-card but for dialog */}
            <DialogContent
                className="max-w-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-xl p-0 overflow-hidden ring-1 ring-white/10 dark:ring-white/5"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">{match.name}&apos;s Profile</DialogTitle>
                <div className="flex flex-col h-full sm:max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-border/50 bg-muted/20">
                        <div className="absolute top-4 right-4 z-10">
                            <MatchCardDropdown onViewProfile={() => { }} />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <Avatar className="h-20 w-20 ring-2 ring-border shadow-md">
                                <AvatarImage src={match.avatar} alt={match.name} className="object-cover" />
                                <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                                    {formatInitials(match.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 mt-1 text-center sm:text-left">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{match.name}</h2>
                                <p className="text-sm font-medium text-emerald-500/90 dark:text-emerald-400 mb-2">{match.role}</p>

                                {(match.location || match.availability) && (
                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-muted-foreground mt-2">
                                        {match.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{match.location} {match.timezone && `• ${match.timezone}`}</span>
                                            </div>
                                        )}
                                        {match.availability && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{availabilityLabels[match.availability]}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-8 flex-1">
                        {/* Bio */}
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-foreground mb-2">About</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">&quot;{match.bio}&quot;</p>
                        </div>

                        {/* Match Analysis */}
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-foreground mb-3">Compatibility Analysis</h3>
                            <MatchScore overall={match.compatibility} showBreakdown={true} />
                        </div>

                        {/* Top Insights */}
                        {match.insights && match.insights.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold tracking-tight text-foreground mb-2">Key Synergies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {match.insights.map((insight, i) => (
                                        <MatchReasonBadge
                                            key={i}
                                            type={insight.type === "complementary" ? "complementary" : insight.type === "shared" ? "interest" : "skill"}
                                            label={insight.text}
                                            className="px-3 py-1 bg-muted/30"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-foreground mb-2">Technical Arsenal</h3>
                            <div className="flex flex-wrap gap-2">
                                {match.skills.map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="bg-muted/30 text-muted-foreground text-xs px-2.5 py-1 font-medium hover:bg-muted/60 transition-colors border border-border/40"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border/50 bg-muted/5 flex gap-3 sticky bottom-0 backdrop-blur-md">
                        <Button className="flex-1 h-10 shadow-sm" variant="default">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Connect Request
                        </Button>
                        <Button variant="outline" className="flex-1 h-10 bg-background/50 hover:bg-background/80 shadow-sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
