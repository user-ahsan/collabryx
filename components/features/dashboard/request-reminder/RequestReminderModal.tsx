"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Handshake,
    ArrowRight,
    Check,
    X,
    User,
    Loader2,
    Sparkles,
    ExternalLink,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { createClient } from "@/lib/supabase/client"
import { getInitials } from "@/lib/utils/format-initials"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PendingRequest {
    id: string
    name: string
    role: string
    avatar: string
    initials: string
    message: string
    timestamp: string
    projectTitle: string
    matchPercentage?: number
    userId?: string
}

// ─── Fallback Data ───────────────────────────────────────────────────────────

const DEFAULT_REQUESTS: PendingRequest[] = [
    {
        id: "1",
        name: "Alex Rivera",
        role: "UI/UX Designer",
        avatar: "/avatars/07.png",
        initials: "AR",
        message: "I'd love to join your fintech project! I have 5+ years of experience in designing mobile apps and web platforms.",
        timestamp: "2h ago",
        projectTitle: "Fintech Team",
        matchPercentage: 92,
        userId: "user-1"
    },
    {
        id: "2",
        name: "Sarah Chen",
        role: "Marketing Lead",
        avatar: "/avatars/08.png",
        initials: "SC",
        message: "I saw your project and think I can help with go-to-market strategy. Happy to discuss!",
        timestamp: "1d ago",
        projectTitle: "Fintech Team",
        matchPercentage: 85,
        userId: "user-2"
    }
]

const CACHE_KEY = "collabryx_pending_requests"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCachedRequests(): PendingRequest[] | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
        return null
    } catch (_error) {
        return null
    }
}

function setCachedRequests(data: PendingRequest[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (_error) {
        // localStorage full or unavailable — no-op
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface RequestReminderModalProps {
    className?: string
}

export function RequestReminderModal({ className }: RequestReminderModalProps) {
    const [open, setOpen] = useState(false)
    const [localRequests, setLocalRequests] = useState<PendingRequest[]>(DEFAULT_REQUESTS)
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
    const [confirmDeclineId, setConfirmDeclineId] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(false)

    // ── Fetch from Supabase → cache → hardcoded fallback ──
    const fetchRequests = useCallback(async () => {
        setIsFetching(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error("Not authenticated")

            const { data, error } = await supabase
                .from("connections")
                .select(`
                    *,
                    requester:profiles!requester_id (
                        display_name,
                        headline,
                        avatar_url
                    )
                `)
                .eq("receiver_id", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false })

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: PendingRequest[] = data.map((r: Record<string, unknown>) => {
                    const requester = r.requester as Record<string, unknown> || {}
                    return {
                        id: String(r.id),
                        name: String(requester.display_name ?? requester.full_name ?? "Unknown"),
                        role: String(requester.headline ?? ""),
                        avatar: String(requester.avatar_url ?? ""),
                        initials: getInitials(requester.display_name as string | null, "U"),
                        message: String(r.message ?? ""),
                        timestamp: formatTimestamp(r.created_at as string),
                        projectTitle: "Connection Request",
                        matchPercentage: undefined,
                        userId: String(r.requester_id),
                    }
                })
                setLocalRequests(mapped)
                setCachedRequests(mapped)
            } else {
                // No pending requests from API
                setLocalRequests([])
                setCachedRequests([])
            }
        } catch (_error) {
            // API failed — try cache, then fallback
            const cached = getCachedRequests()
            setLocalRequests(cached ?? DEFAULT_REQUESTS)
        } finally {
            setIsFetching(false)
        }
    }, [])

    // Fetch on mount and when dialog opens
    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    useEffect(() => {
        if (open) fetchRequests()
    }, [open, fetchRequests])

    // Auto-clear decline confirmation after 3s
    useEffect(() => {
        if (confirmDeclineId) {
            const timer = setTimeout(() => setConfirmDeclineId(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [confirmDeclineId])

    // ── Actions ──
    const handleAction = async (id: string, type: "accept" | "decline") => {
        setLoadingIds(prev => new Set(prev).add(id))
        const request = localRequests.find(r => r.id === id)

        try {
            const supabase = createClient()
            await supabase
                .from("connections")
                .update({ status: type === "accept" ? "accepted" : "declined" })
                .eq("id", id)
        } catch (_error) {
            // API call failed — still remove locally for UX, will sync on next fetch
        }

        setLocalRequests(prev => prev.filter(r => r.id !== id))
        setLoadingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
        setConfirmDeclineId(null)

        if (request) {
            toast(
                `${type === "accept" ? "Accepted" : "Declined"} ${request.name}`,
                {
                    action: {
                        label: "Undo",
                        onClick: () => {
                            setLocalRequests(prev =>
                                [...prev, request].sort(
                                    (a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0)
                                )
                            )
                            // Re-set status in DB
                            try {
                                const supabase = createClient()
                                supabase
                                    .from("connections")
                                    .update({ status: "pending" })
                                    .eq("id", id)
                                    .then(() => { })
                            } catch (_error) {
                                // silent — will reconcile on next fetch
                            }
                        },
                    },
                    duration: 4000,
                }
            )
        }
    }

    const pendingCount = localRequests.length
    if (pendingCount === 0 && !open) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className={cn(
                    "relative rounded-xl md:rounded-2xl overflow-hidden bg-blue-950/[0.05] border border-blue-400/10 transition-all duration-500 cursor-pointer",
                    className
                )}>
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none" />
                    <CardContent className="p-3 md:p-5 relative z-10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                                    <Handshake className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Pending Collaboration Requests
                                        </h3>
                                        <Badge className="h-5 px-2 text-xs font-bold bg-blue-500 text-white border-0">
                                            {pendingCount}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        You have {pendingCount} new {pendingCount === 1 ? 'request' : 'requests'} awaiting response
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="h-8 px-4 rounded-lg font-medium shadow-sm bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                            >
                                Review Requests
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                        </div>
                    </CardContent>
                </div>
            </DialogTrigger>

            <DialogContent
                className={cn(
                    "sm:max-w-[550px] p-0 gap-0 overflow-hidden sm:rounded-2xl",
                    glass("overlay")
                )}
            >
                <DialogHeader className={cn("px-5 py-4 relative z-10", glass("divider"))}>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                            <Handshake className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                Pending Requests
                                <Badge className="h-5 px-2 text-xs font-bold bg-blue-500 text-white border-0">
                                    {localRequests.length}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Review and respond to collaboration requests
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 relative z-10">
                    {isFetching && localRequests.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : localRequests.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <div className="h-16 w-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8 text-teal-500" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">You&apos;re all caught up!</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                No pending requests to review. Time to find your next collaboration partner.
                            </p>
                            <Button
                                className="bg-teal-600 hover:bg-teal-700 rounded-xl font-semibold"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Find More Matches
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {localRequests.map((request) => (
                                <motion.div
                                    key={request.id}
                                    layout
                                    initial={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -80, transition: { duration: 0.3, ease: "easeInOut" } }}
                                    className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] dark:bg-white/[0.02] hover:bg-white/[0.04] dark:hover:bg-white/[0.04] transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <Link
                                            href={`/profile/${request.userId || request.id}`}
                                            className="relative group cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Avatar className="h-12 w-12 border-2 border-teal-500/30 shadow-sm group-hover:border-teal-500/60 transition-colors">
                                                <AvatarImage src={request.avatar} className="object-cover" />
                                                <AvatarFallback className="text-xs bg-teal-500/10 text-teal-500 font-bold">
                                                    <User className="h-5 w-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                            {request.matchPercentage && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="absolute -bottom-1 -right-1 h-5 min-w-[2.25rem] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 border-2 border-background">
                                                                {request.matchPercentage}%
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="text-xs">
                                                            Match score based on skills &amp; experience
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    href={`/profile/${request.userId || request.id}`}
                                                    className="flex items-center gap-1.5 hover:underline"
                                                >
                                                    <p className="font-bold text-foreground">
                                                        {request.name}
                                                    </p>
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                <span className="text-muted-foreground">•</span>
                                                <p className="text-xs text-muted-foreground">{request.role}</p>
                                                <span className="text-muted-foreground">•</span>
                                                <p className="text-[10px] text-muted-foreground">{request.timestamp}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/20 text-blue-600 dark:text-blue-400">
                                                    {request.projectTitle}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.05] border-l-2 border-l-blue-300/20">
                                        <p className="text-xs text-foreground leading-relaxed">{request.message}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                                            asChild
                                        >
                                            <Link href={`/profile/${request.userId || request.id}`}>
                                                View Profile
                                            </Link>
                                        </Button>
                                        <div className="flex gap-2.5">
                                            {confirmDeclineId === request.id ? (
                                                // ── Confirm Decline Step ──
                                                <>
                                                    <button
                                                        className="h-9 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                                                        onClick={() => setConfirmDeclineId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className={cn(
                                                            "h-9 px-5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5",
                                                            "bg-red-500/15 text-red-400 border border-red-500/20",
                                                            "hover:bg-red-500/25 hover:border-red-500/30 hover:text-red-300",
                                                            "active:scale-[0.97] transition-all duration-200",
                                                            "disabled:opacity-50 disabled:pointer-events-none"
                                                        )}
                                                        disabled={loadingIds.has(request.id)}
                                                        onClick={() => handleAction(request.id, "decline")}
                                                    >
                                                        {loadingIds.has(request.id) ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                Confirm Decline
                                                            </>
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                // ── Default Actions ──
                                                <>
                                                    <button
                                                        className={cn(
                                                            "h-9 px-4 rounded-xl text-xs font-medium inline-flex items-center gap-1.5",
                                                            "bg-white/[0.04] text-muted-foreground border border-white/[0.08]",
                                                            "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20",
                                                            "active:scale-[0.97] transition-all duration-200",
                                                            "disabled:opacity-50 disabled:pointer-events-none"
                                                        )}
                                                        disabled={loadingIds.has(request.id)}
                                                        onClick={() => setConfirmDeclineId(request.id)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                        Decline
                                                    </button>
                                                    <button
                                                        className={cn(
                                                            "h-9 px-5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 relative overflow-hidden",
                                                            "bg-gradient-to-r from-teal-600 to-teal-500 text-white",
                                                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                                                            "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                                                            "hover:from-teal-500 hover:to-teal-400",
                                                            "active:scale-[0.97] transition-all duration-200",
                                                            "disabled:opacity-50 disabled:pointer-events-none"
                                                        )}
                                                        disabled={loadingIds.has(request.id)}
                                                        onClick={() => handleAction(request.id, "accept")}
                                                    >
                                                        {/* Shine sweep */}
                                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                        {loadingIds.has(request.id) ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin relative z-10" />
                                                        ) : (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 relative z-10" />
                                                                <span className="relative z-10">Accept</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className={cn("p-4 flex items-center justify-end relative z-10", glass("divider"))}>
                    <Button
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
    try {
        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return "just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    } catch (_error) {
        return isoString
    }
}
