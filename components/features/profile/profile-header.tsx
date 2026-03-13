"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Link as LinkIcon, Calendar, UserPlus, MessageSquare, CheckCircle2, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { VerificationBadge } from "./verification-badge"
import { formatInitials } from "@/lib/utils/format-initials"
import { GlassCard } from "@/components/shared/glass-card"
import { MatchCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { glass } from "@/lib/utils/glass-variants"

type ConnectionStatus = "none" | "connected" | "pending"
type CollaborationReadiness = "available" | "open" | "not-available"
type VerificationType = "student" | "faculty" | "alumni"

interface ProfileHeaderProps {
    connectionStatus?: ConnectionStatus
    collaborationReadiness?: CollaborationReadiness
    matchContext?: {
        project: string
        skills: string[]
    }
    isOwnProfile?: boolean
    isVerified?: boolean
    verificationType?: VerificationType
    university?: string

    // Core details mapped from expected-objects/01-profiles.md
    displayName?: string
    headline?: string
    avatarUrl?: string
    location?: string
    websiteUrl?: string
    skills?: string[] // Top displayed skills
}

export function ProfileHeader({
    connectionStatus = "none",
    collaborationReadiness = "available",
    matchContext,
    isOwnProfile = false,
    isVerified = false,
    verificationType = "student",
    university = "Stanford University",

    // Default mock data to preserve old test render state
    displayName = "Sarah Chen",
    headline = "Full Stack Developer @ TechStart",
    avatarUrl = "/avatars/01.png",
    location = "San Francisco, CA",
    websiteUrl = "github.com/sarahchen",
    skills = ["React", "TypeScript", "Node.js", "AWS"]
}: ProfileHeaderProps) {
    return (
        <GlassCard className="mb-4 md:mb-6 overflow-visible border border-border/60 shadow-xl" innerClassName="p-0">
            {/* Banner */}
            <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent w-full border-b border-border/30 rounded-t-xl overflow-hidden">
                {/* Subtle top-right dropdown menu for interactions */}
                <div className="absolute top-4 right-4 z-10">
                    <MatchCardDropdown onViewProfile={() => { }} />
                </div>
            </div>

            <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start -mt-12 sm:-mt-16">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 ring-4 ring-border shadow-xl shrink-0 z-10 bg-background">
                        <AvatarImage src={avatarUrl} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                            {formatInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 mt-14 sm:mt-16 md:mt-20 space-y-4 md:space-y-5 w-full">
                        <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words text-foreground">{displayName}</h1>
                                    {isVerified && (
                                        <VerificationBadge
                                            type={verificationType}
                                            university={university}
                                            className="shrink-0"
                                        />
                                    )}
                                </div>
                                <p className="text-sm sm:text-base text-emerald-500/90 dark:text-emerald-400 font-medium mt-1.5 break-words">{headline}</p>
                            </div>

                            {/* Primary Action Buttons */}
                            {!isOwnProfile && (
                                <div className="flex gap-2.5 flex-col w-full sm:w-auto sm:flex-row shrink-0">
                                    {connectionStatus === "none" && (
                                        <Button size="default" className="w-full sm:w-auto shadow-md font-medium">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Connect
                                        </Button>
                                    )}
                                    {connectionStatus === "connected" && (
                                        <Button variant="secondary" size="default" disabled className="w-full sm:w-auto bg-primary/10 text-primary border-primary/20">
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Connected
                                        </Button>
                                    )}
                                    {connectionStatus === "pending" && (
                                        <Button variant="secondary" size="default" disabled className="w-full sm:w-auto">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Request Sent
                                        </Button>
                                    )}
                                    <Button variant="outline" size="default" className={cn("w-full sm:w-auto shadow-sm backdrop-blur-sm transition-all", glass("buttonGhost"))}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Message
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* AI Match Context - Shown when user arrives from Smart Matches */}
                        {matchContext && (
                            <div className="flex items-start gap-2 p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md">
                                <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    <span className="font-semibold text-foreground">AI Matched</span> based on your{" "}
                                    <span className="font-semibold">{matchContext.project}</span> &{" "}
                                    <span className="font-semibold">{matchContext.skills.join(", ")}</span> needs
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground font-medium">
                            {location && (
                                <div className="flex items-center gap-1.5 min-w-0 transition-colors hover:text-foreground">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{location}</span>
                                </div>
                            )}
                            {websiteUrl && (
                                <div className="flex items-center gap-1.5 min-w-0 group">
                                    <LinkIcon className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
                                    <a href={`https://${websiteUrl.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline truncate transition-colors group-hover:text-primary">
                                        {websiteUrl.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Calendar className="h-4 w-4" />
                                <span className="whitespace-nowrap">Joined Dec 2024</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="px-2.5 py-1 text-xs border border-border/40 font-medium">
                                    {skill}
                                </Badge>
                            ))}
                        </div>

                        {/* Collaboration Readiness Indicator */}
                        <div className="pt-2 md:pt-3">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs sm:text-sm px-3.5 py-1.5 inline-flex items-center font-medium",
                                    collaborationReadiness === "available" && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
                                    collaborationReadiness === "open" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
                                    collaborationReadiness === "not-available" && "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                                )}
                            >
                                <span className={cn(
                                    "inline-block w-2.5 h-2.5 rounded-full mr-2.5 shrink-0 shadow-sm",
                                    collaborationReadiness === "available" && "bg-green-500 shadow-green-500/50",
                                    collaborationReadiness === "open" && "bg-yellow-500 shadow-yellow-500/50",
                                    collaborationReadiness === "not-available" && "bg-red-500 shadow-red-500/50"
                                )} />
                                <span className="whitespace-nowrap">
                                    {collaborationReadiness === "available" && "Available for collaboration"}
                                    {collaborationReadiness === "open" && "Open to part-time / mentorship"}
                                    {collaborationReadiness === "not-available" && "Not available"}
                                </span>
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}
