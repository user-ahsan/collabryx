/**
 * ProfileHeader — top banner, identity block, social links, completion bar, stats row
 *
 * ENHANCEMENTS OVER ORIGINAL (Phase 1-3):
 *
 * 1. SOCIAL LINKS (github_url, linkedin_url, twitter_url, portfolio_url):
 *    Problem: The DB stored four dedicated social link fields but none were rendered.
 *    Users had no way to discover each other's GitHub profiles, LinkedIn pages, etc.
 *    Solution: Added icon-based social link row with hover-scale animations. Links
 *    auto-format partial handles (e.g. "ahsan" → "https://github.com/ahsan"). Website
 *    URL also appears here if the user prefers to list it as a social link.
 *
 * 2. PROFILE COMPLETION BAR (profile_completion):
 *    Problem: profile_completion (0-100) existed in DB since onboarding but was never
 *    displayed on the profile page. Users couldn't see their completion progress
 *    without going to a separate view. This reduced the incentive to fill missing
 *    sections (bio, skills, experience, etc.).
 *    Solution: Color-coded progress bar (green ≥80%, amber ≥50%, gray below) shown
 *    only on the user's own profile. Provides clear visual incentive for completion.
 *
 * 3. STATS BAR (connectionCount, profileViews, lastActive):
 *    Problem: user_analytics tracked connections_count, profile_views_last_30_days,
 *    last_active, etc. but none appeared on profiles. Visitors couldn't gauge a
 *    user's network size or activity level — key social proof signals.
 *    Solution: Compact stats row with icons (Users, Eye) and an animated green
 *    pulse dot for active status. "Active now" for <1h, "Active 3h ago" etc.
 *    Falls back gracefully if analytics data is unavailable.
 *
 * 4. INLINE HEADLINE EDITING:
 *    Problem: Editing headline required navigating to Settings. Now uses the
 *    InlineEditHeadline component with hover-pencil pattern for instant editing.
 *
 * 5. LAST UPDATED TIMESTAMP (updated_at):
 *    Problem: No indicator of profile freshness. Visitors couldn't tell if a
 *    profile was recently maintained or abandoned years ago.
 *    Solution: Tiny "Updated 2d ago" text using formatRelativeTime().
 */
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Link as LinkIcon, Calendar, Sparkles, GraduationCap, Github, Linkedin, Twitter, Globe, Users, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { VerificationBadge } from "./verification-badge"
import { InlineEditHeadline } from "./inline-edit-headline"
import { formatInitials } from "@/lib/utils/format-initials"
import { GlassCard } from "@/components/shared/glass-card"
import { formatJoinDate, formatRelativeTime } from "@/lib/utils/format-date"

type CollaborationReadiness = "available" | "open" | "not-available"
type VerificationType = "student" | "faculty" | "alumni"

interface ProfileHeaderProps {
    collaborationReadiness?: CollaborationReadiness | null
    matchContext?: {
        project: string
        skills: string[]
    }
    isOwnProfile?: boolean
    isVerified?: boolean
    verificationType?: VerificationType | null
    university?: string | null

    displayName?: string | null
    headline?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    location?: string | null
    websiteUrl?: string | null
    email?: string | null
    skills?: string[]
    createdAt?: string | null
    updatedAt?: string | null

    // Social links
    githubUrl?: string | null
    linkedinUrl?: string | null
    twitterUrl?: string | null
    portfolioUrl?: string | null

    // Profile completion (own profile only)
    profileCompletion?: number | null

    // Stats
    connectionCount?: number
    profileViews?: number
    lastActive?: string | null

    // Action slot for connection button + match score (other profile view)
    actionSlot?: React.ReactNode
}

export function ProfileHeader({
    collaborationReadiness,
    matchContext,
    isOwnProfile = false,
    isVerified = false,
    verificationType,
    university,
    displayName,
    headline,
    avatarUrl,
    bannerUrl,
    location,
    websiteUrl,
    email,
    skills,
    createdAt,
    updatedAt,
    githubUrl,
    linkedinUrl,
    twitterUrl,
    portfolioUrl,
    profileCompletion,
    connectionCount,
    profileViews,
    lastActive,
    actionSlot,
}: ProfileHeaderProps) {
    const safeSkills = skills ?? []
    const safeName = displayName || "User"
    const safeHeadline = headline || undefined

    // Build social links array
    const socialLinks = [
        { url: githubUrl, icon: Github, label: "GitHub" },
        { url: linkedinUrl, icon: Linkedin, label: "LinkedIn" },
        { url: twitterUrl, icon: Twitter, label: "X" },
        { url: portfolioUrl, icon: Globe, label: "Portfolio" },
    ].filter(s => s.url)

    const hasSocialLinks = socialLinks.length > 0 || websiteUrl

    // Format social link href
    const formatSocialUrl = (url: string, label: string): string => {
        if (url.startsWith("http")) return url
        const domains: Record<string, string> = {
            GitHub: "https://github.com/",
            LinkedIn: "https://linkedin.com/in/",
            X: "https://twitter.com/",
        }
        return (domains[label] || "https://") + url
    }

    // Calculate "last active" label
    const getLastActiveLabel = (lastActive: string | null | undefined): string | null => {
        if (!lastActive) return null
        const now = Date.now()
        const then = new Date(lastActive).getTime()
        const diffMs = now - then
        const diffHours = diffMs / (1000 * 60 * 60)
        if (diffHours < 1) return "Active now"
        if (diffHours < 24) return `Active ${Math.round(diffHours)}h ago`
        const diffDays = diffHours / 24
        if (diffDays < 7) return `Active ${Math.round(diffDays)}d ago`
        if (diffDays < 30) return `Active ${Math.round(diffDays)}d ago`
        return null
    }
    const lastActiveLabel = getLastActiveLabel(lastActive)

    return (
        <GlassCard className="mb-4 md:mb-6 overflow-visible border border-border/60 shadow-xl" innerClassName="p-0">
            {/* Banner */}
            <div
                className="relative h-32 sm:h-40 w-full border-b border-border/30 rounded-t-xl overflow-hidden bg-cover bg-center"
                style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
            >
                <div className={cn(
                    "absolute inset-0",
                    bannerUrl ? "bg-black/30" : "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
                )} />
            </div>

            <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start -mt-12 sm:-mt-16">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 ring-4 ring-border shadow-xl shrink-0 z-10 bg-background">
                        <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                            {formatInitials(safeName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 mt-14 sm:mt-16 md:mt-20 space-y-4 md:space-y-5 w-full">
                        <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words text-foreground">{safeName}</h1>
                                    {isVerified && verificationType && (
                                        <VerificationBadge
                                            type={verificationType}
                                            university={university ?? undefined}
                                            className="shrink-0"
                                        />
                                    )}
                                </div>
                                {isOwnProfile ? (
                                    <div className="mt-1.5">
                                        <InlineEditHeadline initialHeadline={headline} />
                                    </div>
                                ) : safeHeadline && (
                                    <p className="text-sm md:text-base text-emerald-500/90 dark:text-emerald-400 font-medium mt-1.5 break-words">{safeHeadline}</p>
                                )}
                            </div>

                            {/* Action slot — connection button + match score for other profile views.
                                Positioned top-right on desktop, flows below on mobile. */}
                            {actionSlot && (
                                <div className="shrink-0 self-start md:mt-1">
                                    {actionSlot}
                                </div>
                            )}
                        </div>

                        {/* University Display */}
                        {university && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GraduationCap className="h-4 w-4 shrink-0 text-primary/70" />
                                <span>{university}</span>
                                {email && (
                                    <>
                                        <span className="text-border mx-1">•</span>
                                        <span className="truncate">{email}</span>
                                    </>
                                )}
                            </div>
                        )}

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

                        {/* Location & Join Date */}
                        <div className="flex flex-wrap gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground font-medium">
                            {location && (
                                <div className="flex items-center gap-1.5 min-w-0 transition-colors hover:text-foreground">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{location}</span>
                                </div>
                            )}
                            {createdAt && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                    <span className="whitespace-nowrap">Joined {formatJoinDate(createdAt)}</span>
                                </div>
                            )}
                            {updatedAt && (
                                <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/60">
                                    <span className="text-[10px]">Updated {formatRelativeTime(updatedAt)}</span>
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {hasSocialLinks && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {socialLinks.map((link) => (
                                    link.url && (
                                        <a
                                            key={link.label}
                                            href={formatSocialUrl(link.url, link.label)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors group"
                                            title={link.label}
                                        >
                                            <link.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                                            <span className="hidden sm:inline truncate max-w-[100px]">{link.label}</span>
                                        </a>
                                    )
                                ))}
                                {websiteUrl && (
                                    <a
                                        href={`https://${websiteUrl.replace(/^https?:\/\//, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors group"
                                        title="Website"
                                    >
                                        <LinkIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                                        <span className="hidden sm:inline truncate max-w-[100px]">Website</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Profile Completion Bar (own profile only) */}
                        {isOwnProfile && profileCompletion !== null && profileCompletion !== undefined && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-medium">Profile Completion</span>
                                    <span className={cn(
                                        "font-semibold",
                                        profileCompletion >= 80 ? "text-green-500" :
                                        profileCompletion >= 50 ? "text-amber-500" : "text-muted-foreground"
                                    )}>{profileCompletion}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden ring-1 ring-border/20">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            profileCompletion >= 80 ? "bg-green-500" :
                                            profileCompletion >= 50 ? "bg-amber-500" : "bg-primary/60"
                                        )}
                                        style={{ width: `${profileCompletion}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {safeSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {safeSkills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="px-2.5 py-1 text-xs border border-border/40 font-medium">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Collaboration Readiness Indicator */}
                        {collaborationReadiness && (
                            <div className="pt-2 md:pt-3">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs md:text-sm px-4 py-1.5 inline-flex items-center font-medium",
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
                        )}

                        {/* Stats Bar */}
                        {(connectionCount !== undefined || profileViews !== undefined || lastActiveLabel) && (
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-3 border-t border-border/20">
                                {connectionCount !== undefined && (
                                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                                        <Users className="h-3.5 w-3.5 shrink-0" />
                                        <span className="font-semibold text-foreground">{connectionCount}</span>
                                        <span>connections</span>
                                    </div>
                                )}
                                {profileViews !== undefined && (
                                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="font-semibold text-foreground">{profileViews}</span>
                                        <span>profile views (30d)</span>
                                    </div>
                                )}
                                {lastActiveLabel && (
                                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                        </span>
                                        <span>{lastActiveLabel}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}
