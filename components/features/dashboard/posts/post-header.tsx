"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe } from "lucide-react"
import { PostCardDropdown } from "@/components/shared/glass-dropdown-menu"

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

export function PostHeader({ authorId, author, role, time, avatar, initials, postTypeBadge, isOwner = false, hideOptions = false }: PostHeaderProps) {
    const targetUserId = authorId || "1"

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
            {!hideOptions && <PostCardDropdown isOwner={isOwner} />}
        </div>
    )
}
