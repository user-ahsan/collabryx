"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, ThumbsUp, Heart, Flame, Frown, Angry } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RichTextDisplay } from "../posts/rich-text-display"
import { GlassBubble, GlassBubbleBadge } from "@/components/shared/glass-bubble"
import { cn } from "@/lib/utils"
import { useComments, useCreateComment, useToggleLikeComment } from "@/hooks/use-comments"
import { Skeleton } from "@/components/ui/skeleton"

const COMMENT_REACTIONS = [
    { id: "like", icon: ThumbsUp },
    { id: "love", icon: Heart },
    { id: "haha", icon: Smile },
    { id: "wow", icon: Flame },
    { id: "sad", icon: Frown },
    { id: "angry", icon: Angry }
]

export interface CommentType {
    id: string
    author: {
        name: string
        avatar: string
        initials: string
    }
    content: string
    timestamp: string
    likes: number
    liked?: boolean
    replies?: CommentType[]
}

interface CommentSectionProps {
    postId: string
}

function CommentItem({
    comment,
    depth = 0,
    onReply,
    onToggleLike
}: {
    comment: CommentType
    depth?: number
    onReply: (parentId: string, text: string) => void
    onToggleLike: (commentId: string) => void
}) {
    const [showReplies, setShowReplies] = useState(false)
    const [visibleReplies, setVisibleReplies] = useState(3)
    const [isReplying, setIsReplying] = useState(false)
    const [replyText, setReplyText] = useState("")

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!replyText.trim()) return
        onReply(comment.id, replyText)
        setReplyText("")
        setIsReplying(false)
        setShowReplies(true)
    }

    const hasReplies = comment.replies && comment.replies.length > 0

    return (
        <div className={cn("relative flex gap-3", depth > 0 ? "mt-3" : "mt-0")}>

            <Avatar className={cn("cursor-pointer ring-1 ring-white/5 transition-transform hover:scale-105 shrink-0", depth > 0 ? "h-6 w-6 mt-1" : "h-8 w-8 mt-0.5")}>
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback className={depth > 0 ? "text-[10px]" : "text-xs"}>{comment.author.initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 max-w-full">
                <GlassBubble variant="comment" className="inline-block relative group/bubble max-w-full break-words">
                <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground cursor-pointer hover:underline mb-0.5">
                        {comment.author.name}
                    </p>
                    <RichTextDisplay
                        content={comment.content}
                        className="text-sm text-foreground/90 leading-snug"
                        truncate={true}
                        maxWords={40}
                    />
                </div>

                {/* Like Count Badge */}
                {comment.likes > 0 && (
                    <GlassBubbleBadge>
                        <div className="bg-primary/10 rounded-full p-0.5">
                            <ThumbsUp className="h-2 w-2 text-primary fill-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{comment.likes}</span>
                    </GlassBubbleBadge>
                )}
            </GlassBubble>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <div className="group/likes relative">
                        <button
                            onClick={() => onToggleLike(comment.id)}
                            className={`text-xs font-bold transition-colors hover:underline ${comment.liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Like
                        </button>
                    </div>
                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-all duration-200 cursor-pointer"
                    >
                        Reply
                    </button>
                    <span className="text-xs text-muted-foreground font-medium">{comment.timestamp}</span>
                </div>

                {isReplying && (
                    <form onSubmit={handleReplySubmit} className="flex gap-2 items-center mt-3 relative">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src="/avatars/01.png" />
                            <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                        </Avatar>
                        <Input
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.author.name.split(' ')[0]}...`}
                            className={cn(
                                "h-8 text-[13px] rounded-full pr-10 transition-all font-medium",
                                "bg-background/40 backdrop-blur-md border border-border/40",
                                "focus:bg-background/60 focus:border-border"
                            )}
                        />
                        {replyText.trim() && (
                            <Button
                                aria-label="Send reply"
                                type="submit"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-primary-foreground rounded-full transition-all hover:scale-105 cursor-pointer"
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        )}
                    </form>
                )}

                {hasReplies && (
                    <div className={cn("mt-2 relative", depth === 0 ? "-ml-7 border-l-2 border-muted/50 pl-[26px]" : "pl-0 ml-0")}>
                        {!showReplies ? (
                            <button
                                onClick={() => setShowReplies(true)}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group/view-replies py-1 whitespace-nowrap"
                            >
                                <div className="h-px w-6 bg-muted-foreground/30 group-hover/view-replies:bg-foreground/50 transition-colors" />
                                View {comment.replies!.length} repl{comment.replies!.length === 1 ? 'y' : 'ies'}
                            </button>
                        ) : (
                            <div className={cn("flex flex-col gap-3 relative group/comment", depth > 0 && "-ml-9")}>
                                {comment.replies!.slice(0, visibleReplies).map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        depth={depth + 1}
                                        onReply={onReply}
                                        onToggleLike={onToggleLike}
                                    />
                                ))}

                                {visibleReplies < comment.replies!.length && (
                                    <button
                                        onClick={() => setVisibleReplies(prev => prev + 5)}
                                        className={cn(
                                            "flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group/view-more-replies py-1 whitespace-nowrap",
                                            depth > 0 && "ml-9"
                                        )}
                                    >
                                        <div className="h-px w-6 bg-muted-foreground/30 group-hover/view-more-replies:bg-foreground/50 transition-colors" />
                                        View {comment.replies!.length - visibleReplies} more repl{comment.replies!.length - visibleReplies === 1 ? 'y' : 'ies'}
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowReplies(false)}
                                    className={cn(
                                        "flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group/hide-replies py-1 whitespace-nowrap",
                                        depth > 0 && "ml-9"
                                    )}
                                >
                                    <div className="h-px w-6 bg-muted-foreground/30 group-hover/hide-replies:bg-foreground/50 transition-colors" />
                                    Hide replies
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { data: comments, isLoading, error } = useComments(postId, { includeReplies: true })
    const createComment = useCreateComment(postId)
    const toggleLike = useToggleLikeComment(postId)
    const [text, setText] = useState("")
    const [visibleCount, setVisibleCount] = useState(3)

    // aria-live region for real-time comment updates

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        createComment.mutate(text, {
            onSuccess: () => {
                setText("")
            }
        })
    }

    const handleReply = (parentId: string, replyText: string) => {
        createComment.mutate(replyText)
    }

    const handleToggleLike = (commentId: string) => {
        const comment = comments?.find(c => c.id === commentId)
        toggleLike.mutate({ commentId, isLiked: comment?.user_has_liked || false })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Failed to load comments</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No comments yet</p>
                <p className="text-sm text-muted-foreground">Be the first to comment!</p>
            </div>
        )
    }

    return (
        <div className="pt-2 flex flex-col h-full max-h-full">
            {/* aria-live region for announcing new comments */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {comments?.length || 0} comments loaded
            </div>

            {/* Comment List */}
            <div className="space-y-4 pb-4" role="feed" aria-label="Comments">
                {comments.slice(0, visibleCount).map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={{
                            id: comment.id,
                            author: {
                                name: comment.author_name,
                                avatar: comment.author_avatar,
                                initials: formatInitials(comment.author_name)
                            },
                            content: comment.content,
                            timestamp: comment.time_ago,
                            likes: comment.like_count || 0,
                            liked: comment.user_has_liked,
                            replies: comment.replies?.map(r => ({
                                id: r.id,
                                author: {
                                    name: r.author_name,
                                    avatar: r.author_avatar,
                                    initials: formatInitials(r.author_name)
                                },
                                content: r.content,
                                timestamp: r.time_ago,
                                likes: r.like_count || 0,
                            }))
                        }}
                        onReply={handleReply}
                        onToggleLike={handleToggleLike}
                    />
                ))}

                {comments.length > visibleCount && (
                    <div className="pl-12 pt-2">
                        <Button
                            variant="link"
                            className="text-xs text-muted-foreground hover:text-primary h-auto p-0 font-medium"
                            onClick={() => setVisibleCount(prev => prev + 5)}
                        >
                            View {comments.length - visibleCount} more comment{comments.length - visibleCount !== 1 ? 's' : ''}
                        </Button>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className={cn(
                "flex gap-2 md:gap-3 items-center sticky bottom-0 pt-2 pb-1 md:pb-2 z-10 mt-auto",
                "bg-background/80 backdrop-blur-xl border-t border-border/40"
            )}>
                <Avatar className="h-8 w-8 hidden sm:block shrink-0">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmit} className="flex-1 relative group w-full">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write a comment..."
                        className={cn(
                            "h-9 w-full text-sm rounded-full pr-20 transition-all font-medium placeholder:text-muted-foreground/50",
                            "bg-background/40 backdrop-blur-md border border-border/40",
                            "focus:bg-background/60 focus:border-border"
                        )}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center pr-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button aria-label="Open emoji picker" type="button" size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer h-7 w-7">
                                    <Smile className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="end" side="top">
                                <div className="grid grid-cols-5 gap-2">
                                    {["👍", "❤️", "😂", "🔥", "🙌", "😍", "😭", "😮", "🎉", "💯"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            className="text-xl hover:bg-muted p-1 rounded transition-colors"
                                            onClick={() => setText(prev => prev + emoji)}
                                            type="button"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {text.trim() && (
                            <Button
                                aria-label="Send comment"
                                type="submit"
                                size="icon"
                                className="h-7 w-7 text-primary-foreground rounded-full ml-1 transition-all hover:scale-105 cursor-pointer"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

function formatInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}
