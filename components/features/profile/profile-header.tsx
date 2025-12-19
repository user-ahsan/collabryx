"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Link as LinkIcon, Calendar, UserPlus, MessageSquare, CheckCircle2, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { VerificationBadge } from "./verification-badge"

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
}

export function ProfileHeader({
    connectionStatus = "none",
    collaborationReadiness = "available",
    matchContext,
    isOwnProfile = false,
    isVerified = false,
    verificationType = "student",
    university = "Stanford University"
}: ProfileHeaderProps) {
    return (
        <div className="bg-card border rounded-lg overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/30 w-full" />

            <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                    {/* Avatar */}
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 mt-12 md:mt-14 space-y-4 w-full">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold">Sarah Chen</h1>
                                    {isVerified && (
                                        <VerificationBadge
                                            type={verificationType}
                                            university={university}
                                        />
                                    )}
                                </div>
                                <p className="text-muted-foreground font-medium">Full Stack Developer @ TechStart</p>
                            </div>
                            {!isOwnProfile && (
                                <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Message
                                    </Button>
                                    {connectionStatus === "none" && (
                                        <Button className="w-full sm:w-auto">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Connect
                                        </Button>
                                    )}
                                    {connectionStatus === "connected" && (
                                        <Button variant="secondary" disabled className="w-full sm:w-auto">
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Connected
                                        </Button>
                                    )}
                                    {connectionStatus === "pending" && (
                                        <Button variant="secondary" disabled className="w-full sm:w-auto">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Request Sent
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Match Context - Shown when user arrives from Smart Matches */}
                        {matchContext && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">AI Matched</span> based on your{" "}
                                    <span className="font-medium">{matchContext.project}</span> &{" "}
                                    <span className="font-medium">{matchContext.skills.join(", ")}</span> needs
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                San Francisco, CA
                            </div>
                            <div className="flex items-center gap-1">
                                <LinkIcon className="h-4 w-4" />
                                <a href="#" className="hover:underline">github.com/sarahchen</a>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Joined December 2024
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">React</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">Node.js</Badge>
                            <Badge variant="secondary">AWS</Badge>
                        </div>

                        {/* Collaboration Readiness Indicator */}
                        <div className="pt-2">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-sm px-3 py-1",
                                    collaborationReadiness === "available" && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
                                    collaborationReadiness === "open" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
                                    collaborationReadiness === "not-available" && "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                                )}
                            >
                                <span className={cn(
                                    "inline-block w-2 h-2 rounded-full mr-2",
                                    collaborationReadiness === "available" && "bg-green-500",
                                    collaborationReadiness === "open" && "bg-yellow-500",
                                    collaborationReadiness === "not-available" && "bg-red-500"
                                )} />
                                {collaborationReadiness === "available" && "Available for collaboration"}
                                {collaborationReadiness === "open" && "Open to part-time / mentorship"}
                                {collaborationReadiness === "not-available" && "Not available"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
