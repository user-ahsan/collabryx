"use client"

import { ReactNode } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe } from "lucide-react"
import { PostOptionsDropdown } from "./post-options-dropdown"

interface PostHeaderProps {
    author: string
    role: string
    time: string
    avatar: string
    initials: string
    postTypeBadge?: ReactNode
    isOwner?: boolean
}

export function PostHeader({ author, role, time, avatar, initials, postTypeBadge, isOwner = false }: PostHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-2">
            <div className="flex gap-3 md:gap-4 min-w-0 flex-1">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 cursor-pointer ring-2 ring-background shadow-sm shrink-0">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm md:text-base text-foreground hover:text-primary cursor-pointer transition-colors truncate">
                        {author}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 md:gap-1.5 mt-0.5 flex-wrap">
                        <span className="truncate">{role}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400/40 shrink-0" />
                        <span className="shrink-0">{time}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400/40 shrink-0" />
                        <Globe className="h-3 w-3 shrink-0" />
                    </p>
                    {postTypeBadge && (
                        <div className="mt-1.5 md:mt-2">
                            {postTypeBadge}
                        </div>
                    )}
                </div>
            </div>
            <PostOptionsDropdown isOwner={isOwner} />
        </div>
    )
}
