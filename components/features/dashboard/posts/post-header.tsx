"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Plus, Check, Clock, Loader2 } from "lucide-react"
import { PostCardDropdown } from "@/components/shared/glass-dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCheckConnectionStatus, useSendConnectionRequest } from "@/hooks/use-connections"

interface PostHeaderProps {
    authorId?: string
    author: string
    role: string
    time: string
    avatar: string
    initials: string
    postTypeBadge?: ReactNode
    isOwner?: boolean
    hideOptions?: boolean
}

// ===========================================
// CONNECT BUTTON — inline compact for post cards
// ===========================================

function ConnectButton({ userId }: { userId: string }) {
    const { data: status, isLoading: statusLoading } = useCheckConnectionStatus(userId)
    const sendRequest = useSendConnectionRequest()
    const [isSending, setIsSending] = useState(false)

    const handleConnect = async () => {
        setIsSending(true)
        try {
            await sendRequest.mutateAsync({
                receiver_id: userId,
                message: "Hi, I'd like to connect! I saw your post and thought maybe we could work on something together.",
            })
        } catch {
            // Error toast handled by the hook
        } finally {
            setIsSending(false)
        }
    }

    // Loading / checking status
    if (statusLoading) {
        return (
            <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-7 px-2 text-xs gap-1 rounded-md opacity-50 pointer-events-none"
                aria-label="Checking connection status"
            >
                <Loader2 className="h-3 w-3 animate-spin" />
            </Button>
        )
    }

    // Accepted — already connected
    if (status === "accepted") {
        return (
            <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-7 px-2 text-xs gap-1 rounded-md text-green-600 dark:text-green-400 opacity-70 cursor-default"
                aria-label="Already connected"
            >
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">Connected</span>
            </Button>
        )
    }

    // Pending — request already sent
    if (status === "pending") {
        return (
            <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-7 px-2 text-xs gap-1 rounded-md text-amber-600 dark:text-amber-400 opacity-70 cursor-default"
                aria-label="Connection request pending"
            >
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">Pending</span>
            </Button>
        )
    }

    // Blocked — don't show anything
    if (status === "blocked") {
        return null
    }

    // Not connected — show Connect button
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
                e.stopPropagation()
                handleConnect()
            }}
            disabled={isSending}
            className={cn(
                "h-7 px-2 text-xs gap-1 rounded-md transition-all",
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
                isSending && "opacity-50 pointer-events-none"
            )}
            aria-label="Send connection request"
        >
            {isSending ? (
                <>
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    <span className="hidden sm:inline">Sending</span>
                </>
            ) : (
                <>
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Connect</span>
                </>
            )}
        </Button>
    )
}

// ===========================================
// POST HEADER
// ===========================================

export function PostHeader({ authorId, author, role, time, avatar, initials, postTypeBadge, isOwner = false, hideOptions = false }: PostHeaderProps) {
    const { user: currentUser } = useAuth()
    const targetUserId = authorId || "1"
    const isOwnPost = currentUser?.id === targetUserId

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3 md:gap-4 min-w-0 flex-1">
                <Link href={`/profile/${targetUserId}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 cursor-pointer ring-2 ring-background shadow-sm hover:ring-primary/20 transition-all">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                    <Link href={`/profile/${targetUserId}`} onClick={(e) => e.stopPropagation()}>
                        <h4 className="font-semibold text-base text-foreground hover:text-primary cursor-pointer transition-colors truncate">
                            {author}
                        </h4>
                    </Link>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1 flex-wrap">
                        <span className="truncate">{role}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="shrink-0">{time}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        <Globe className="h-3 w-3 shrink-0" />
                    </p>
                    {postTypeBadge && (
                        <div className="mt-2">
                            {postTypeBadge}
                        </div>
                    )}
                </div>
            </div>

            {/* Right side: Connect button + Dropdown */}
            <div className="flex items-start gap-0.5 shrink-0">
                {!isOwnPost && authorId && <ConnectButton userId={authorId} />}
                {!hideOptions && <PostCardDropdown isOwner={isOwner} />}
            </div>
        </div>
    )
}
