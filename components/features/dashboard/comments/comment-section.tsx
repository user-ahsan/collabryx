"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, ThumbsUp, Heart, Flame, Frown, Angry } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RichTextDisplay } from "../posts/rich-text-display"
import { cn } from "@/lib/utils"

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
    comments?: CommentType[]
    onAddComment?: (text: string, parentId?: string) => void
}

const DUMMY_COMMENTS: CommentType[] = [
    {
        id: "c1",
        author: {
            name: "Sarah Miller",
            avatar: "/avatars/02.png",
            initials: "SM"
        },
        content: "This looks amazing! Can't wait to try it out.",
        timestamp: "1h ago",
        likes: 4,
        liked: true,
        replies: [
            {
                id: "c1-1",
                author: {
                    name: "Alex Johnson",
                    avatar: "/avatars/04.png",
                    initials: "AJ"
                },
                content: "I totally agree! The design feels very cohesive and the interactions are exactly what we've been looking for. I think this will greatly improve user engagement across the board.",
                timestamp: "45m ago",
                likes: 1
            }
        ]
    },
    {
        id: "c2",
        author: {
            name: "David Chen",
            avatar: "/avatars/03.png",
            initials: "DC"
        },
        content: "Great work team! 🚀 The UI is silky smooth. I spent some time really clicking through all of the edge cases and I must say I haven't found a single glitch yet. Very impressive for a day 1 release candidate! Keep up the brilliant momentum.",
        timestamp: "45m ago",
        likes: 2
    }
]

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
                <div className="flex items-start gap-2 max-w-full">
                    <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-2xl rounded-tl-none px-3 py-2 inline-block relative group/bubble hover:bg-background/60 transition-colors max-w-full break-words shadow-sm">
                        <p className="text-sm font-semibold text-foreground cursor-pointer hover:underline mb-0.5">
                            {comment.author.name}
                        </p>
                        <RichTextDisplay
                            content={comment.content}
                            className="text-sm text-foreground/90 leading-snug"
                            truncate={true}
                            maxWords={40}
                        />

                        {/* Like Count Badge */}
                        {comment.likes > 0 && (
                            <div className="absolute -bottom-2.5 right-1 bg-background border border-white/10 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10">
                                <div className="bg-primary/10 rounded-full p-0.5">
                                    <ThumbsUp className="h-2 w-2 text-primary fill-primary" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{comment.likes}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <div className="group/likes relative">
                        <button
                            onClick={() => onToggleLike(comment.id)}
                            className={`text-xs font-bold transition-colors hover:underline ${comment.liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Like
                        </button>

                        {/* Hover Reaction Menu with Bridge */}
                        <div className="absolute bottom-full left-0 mb-0 hidden group-hover/likes:flex flex-col items-start animate-in slide-in-from-bottom-1 fade-in duration-200 z-50">
                            <div className="h-2 w-full bg-transparent" />
                            <div className="bg-background border border-white/10 shadow-xl rounded-full p-1 gap-1 flex items-center -ml-2">
                                {COMMENT_REACTIONS.map((reaction) => (
                                    <button
                                        key={reaction.id}
                                        aria-label={`React with ${reaction.id}`}
                                        className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-full hover:scale-125 transition-transform text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggleLike(comment.id)
                                        }}
                                    >
                                        <reaction.icon className="h-4 w-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
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
                            className="h-8 text-[13px] rounded-full bg-background border border-border/40 focus:bg-background focus:border-border pr-10 transition-all font-medium"
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

export function CommentSection({ comments: initialComments = DUMMY_COMMENTS, onAddComment }: CommentSectionProps) {
    const [comments, setComments] = useState(initialComments)
    const [text, setText] = useState("")
    const [visibleCount, setVisibleCount] = useState(3)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        // Optimistic update
        const newComment: CommentType = {
            id: Date.now().toString(),
            author: {
                name: "Me",
                avatar: "/avatars/01.png",
                initials: "ME"
            },
            content: text,
            timestamp: "Just now",
            likes: 0
        }

        setComments(prev => [newComment, ...prev])
        onAddComment?.(text)
        setText("")
    }

    const handleReply = (parentId: string, replyText: string) => {
        const newReply: CommentType = {
            id: Date.now().toString(),
            author: {
                name: "Me",
                avatar: "/avatars/01.png",
                initials: "ME"
            },
            content: replyText,
            timestamp: "Just now",
            likes: 0
        }

        // Deep update helper
        const addReplyToTree = (items: CommentType[]): CommentType[] => {
            return items.map(item => {
                if (item.id === parentId) {
                    return { ...item, replies: [...(item.replies || []), newReply] }
                }
                if (item.replies) {
                    return { ...item, replies: addReplyToTree(item.replies) }
                }
                return item
            })
        }

        setComments(prev => addReplyToTree(prev))
    }

    const toggleLike = (id: string) => {
        const toggleLikeInTree = (items: CommentType[]): CommentType[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
                }
                if (item.replies) {
                    return { ...item, replies: toggleLikeInTree(item.replies) }
                }
                return item
            })
        }
        setComments(prev => toggleLikeInTree(prev))
    }

    return (
        <div className="pt-2 flex flex-col h-full max-h-full">
            {/* Comment List */}
            <div className="space-y-4 pb-4">
                {comments.slice(0, visibleCount).map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReply}
                        onToggleLike={toggleLike}
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
            <div className="flex gap-2 md:gap-3 items-center sticky bottom-0 pt-2 pb-1 md:pb-2 bg-background/80 backdrop-blur-md z-10 mt-auto">
                <Avatar className="h-8 w-8 hidden sm:block shrink-0">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmit} className="flex-1 relative group w-full">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write a comment..."
                        className="h-9 w-full text-sm rounded-full bg-background border border-border/40 focus:bg-background focus:border-border pr-20 transition-all font-medium placeholder:text-muted-foreground/50"
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
