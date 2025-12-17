"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MoreHorizontal, Smile, ThumbsUp } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const COMMENT_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"]

interface Comment {
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
}

interface CommentSectionProps {
    comments?: Comment[]
    onAddComment?: (text: string) => void
}

const DUMMY_COMMENTS: Comment[] = [
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
        liked: true
    },
    {
        id: "c2",
        author: {
            name: "David Chen",
            avatar: "/avatars/03.png",
            initials: "DC"
        },
        content: "Great work team! 🚀 The UI is silky smooth.",
        timestamp: "45m ago",
        likes: 2
    }
]

export function CommentSection({ comments: initialComments = DUMMY_COMMENTS, onAddComment }: CommentSectionProps) {
    const [comments, setComments] = useState(initialComments)
    const [text, setText] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        // Optimistic update
        const newComment: Comment = {
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

        setComments(prev => [...prev, newComment])
        onAddComment?.(text)
        setText("")
    }

    const toggleLike = (id: string) => {
        setComments(prev => prev.map(c =>
            c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
        ))
    }

    return (
        <div className="pt-2">
            {/* Comment List */}
            <div className="space-y-6 pb-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 items-start group">
                        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-background transition-transform hover:scale-105">
                            <AvatarImage src={comment.author.avatar} />
                            <AvatarFallback>{comment.author.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                                <div className="bg-muted/40 rounded-2xl rounded-tl-none px-4 py-3 inline-block relative group/bubble hover:bg-muted/60 transition-colors">
                                    <p className="text-sm font-bold text-foreground cursor-pointer hover:underline mb-0.5">
                                        {comment.author.name}
                                    </p>
                                    <p className="text-[15px] text-foreground/90 leading-snug">
                                        {comment.content}
                                    </p>

                                    {/* Like Count Badge */}
                                    {comment.likes > 0 && (
                                        <div className="absolute -bottom-2.5 right-1 bg-background border shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
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
                                        onClick={() => toggleLike(comment.id)}
                                        className={`text-xs font-bold transition-colors hover:underline ${comment.liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Like
                                    </button>

                                    {/* Hover Reaction Menu with Bridge */}
                                    <div className="absolute bottom-full left-0 mb-0 hidden group-hover/likes:flex flex-col items-start animate-in slide-in-from-bottom-1 fade-in duration-200 z-50">
                                        {/* Invisible Bridge to prevent closing */}
                                        <div className="h-2 w-full bg-transparent" />

                                        <div className="bg-background border shadow-xl rounded-full p-1 gap-1 flex items-center -ml-2">
                                            {COMMENT_REACTIONS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    className="h-8 w-8 flex items-center justify-center text-xl hover:bg-muted rounded-full hover:scale-125 transition-transform"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // Handle specific reaction logic here
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors">Reply</button>
                                <span className="text-xs text-muted-foreground font-medium">{comment.timestamp}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="flex gap-3 items-center sticky bottom-0 pb-2 pt-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmit} className="flex-1 relative group">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write a comment..."
                        className="h-10 rounded-full bg-muted/40 border-transparent focus:bg-background focus:border-border pr-20 transition-all font-medium placeholder:text-muted-foreground/50"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center pr-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
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
                                type="submit"
                                size="icon"
                                className="h-8 w-8 text-primary-foreground rounded-full ml-1"
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
