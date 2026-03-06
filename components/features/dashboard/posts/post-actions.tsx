"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, Heart, Laugh, Flame, Frown, Angry, MessageCircle, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactionPicker } from "../comments/reaction-picker"

interface PostActionsProps {
    postId: number
    myReaction?: string | null
    onLike: (postId: number) => void
    onReaction: (postId: number, reaction: string) => void
    onCommentClick: (postId: number) => void
    onShareClick: (postId: number) => void
}

const REACTION_MAP: Record<string, { label: string, icon: any, color: string }> = {
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
        <div className="px-3 md:px-5 pb-3 md:pb-4 pt-2">
            <div className="flex items-center justify-between pt-1 relative gap-1 md:gap-0">
                {/* Like / Reaction Group */}
                <div className="flex-1 relative group/reaction">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full rounded-lg transition-all gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3",
                            reactionConfig?.color || "text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10"
                        )}
                        onClick={() => onLike(postId)}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {reactionConfig?.icon ? (
                            <ReactionIcon className={cn("h-4 w-4", reactionConfig.color, "fill-current")} />
                        ) : myReaction ? (
                            <span className="text-base md:text-lg leading-none">{myReaction}</span>
                        ) : (
                            <ThumbsUp className="h-4 w-4 stroke-[1.5px]" />
                        )}

                        <span className="font-medium text-xs md:text-sm">
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
                </div>

                <Button
                    variant="ghost"
                    className="flex-1 rounded-lg text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10 transition-all gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3"
                    onClick={() => onCommentClick(postId)}
                >
                    <MessageCircle className="h-4 w-4 stroke-[1.5px]" />
                    <span className="font-medium text-xs md:text-sm">Comment</span>
                </Button>

                <Button
                    variant="ghost"
                    className="flex-1 rounded-lg text-muted-foreground hover:text-blue-400 hover:!bg-blue-500/10 transition-all gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3"
                    onClick={() => onShareClick(postId)}
                >
                    <Share2 className="h-4 w-4 stroke-[1.5px]" />
                    <span className="font-medium text-xs md:text-sm">Share</span>
                </Button>
            </div>
        </div>
    )
}
