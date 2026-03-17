"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, Heart, Laugh, Flame, Frown, Angry, MessageCircle, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactionPicker } from "../comments/reaction-picker"

interface PostActionsProps {
    postId: string
    myReaction?: string | null
    onLike: (postId: string) => void
    onReaction: (postId: string, reaction: string) => void
    onCommentClick: (postId: string) => void
    onShareClick: (postId: string) => void
}

const REACTION_MAP: Record<string, { label: string, icon: typeof ThumbsUp, color: string }> = {
    "like": { label: "Like", icon: ThumbsUp, color: "text-blue-500" },
    "love": { label: "Love", icon: Heart, color: "text-red-500" },
    "haha": { label: "Haha", icon: Laugh, color: "text-yellow-500" },
    "wow": { label: "Wow", icon: Flame, color: "text-orange-500" },
    "sad": { label: "Sad", icon: Frown, color: "text-blue-400" },
    "angry": { label: "Angry", icon: Angry, color: "text-red-600" },
}

export function PostActions({ postId, myReaction, onLike, onReaction, onCommentClick, onShareClick }: PostActionsProps) {
    const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        setReactionPickerOpen(true)
    }

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = setTimeout(() => {
            setReactionPickerOpen(false)
        }, 300)
    }

    const handleReactionSelect = (emoji: string) => {
        onReaction(postId, emoji)
        setReactionPickerOpen(false)
    }

    const reactionConfig = myReaction ? REACTION_MAP[myReaction] : null
    const ReactionIcon = reactionConfig?.icon || ThumbsUp

    return (
        <div className="pt-2">
            <div className="flex items-center gap-2 relative">
                <Button
                    variant="ghost"
                    aria-label={reactionConfig ? `Remove ${reactionConfig.label} reaction` : "Like this post"}
                    className={cn(
                        "rounded-lg transition-all gap-2 h-9 px-4",
                        reactionConfig?.color || "text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10"
                    )}
                    onClick={() => onLike(postId)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {reactionConfig?.icon ? (
                        <ReactionIcon className={cn("h-4 w-4", reactionConfig.color, "fill-current")} />
                    ) : myReaction ? (
                        <span className="text-lg leading-none">{myReaction}</span>
                    ) : (
                        <ThumbsUp className="h-4 w-4 stroke-[1.5px]" />
                    )}

                    <span className="font-medium text-sm">
                        {reactionConfig?.label || "Like"}
                    </span>
                </Button>

                {reactionPickerOpen && (
                    <div
                        className="absolute bottom-full left-0 mb-2 z-20"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <ReactionPicker
                            isOpen={true}
                            onSelect={handleReactionSelect}
                        />
                    </div>
                )}

                <Button
                    variant="ghost"
                    aria-label="Comment on this post"
                    className="rounded-lg text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10 transition-all gap-2 h-9 px-4"
                    onClick={() => onCommentClick(postId)}
                >
                    <MessageCircle className="h-4 w-4 stroke-[1.5px]" />
                    <span className="font-medium text-sm">Comment</span>
                </Button>

                <Button
                    variant="ghost"
                    aria-label="Share this post"
                    className="rounded-lg text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10 transition-all gap-2 h-9 px-4"
                    onClick={() => onShareClick(postId)}
                >
                    <Share2 className="h-4 w-4 stroke-[1.5px]" />
                    <span className="font-medium text-sm">Share</span>
                </Button>
            </div>
        </div>
    )
}
