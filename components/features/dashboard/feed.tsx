"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Image as ImageIcon,
    Smile,
    X,
    MoreHorizontal,
    Heart,
    MessageCircle,
    Share2,
    Calendar,
    FileText,
    Globe,
    ThumbsUp,
    Bot
} from "lucide-react"
import { cn } from "@/lib/utils"

// New Ecosystem Imports
import { PostOptionsDropdown } from "./post-options-dropdown"
import { RichTextDisplay } from "./rich-text-display"
import { LinkPreview } from "./link-preview"
import { PostSkeleton } from "./post-skeleton"
import { NewPostsIndicator } from "./new-posts-indicator"
import { InfiniteScrollTrigger } from "./infinite-scroll-trigger"
import { CommentSection } from "./comment-section"
import { ReactionPicker } from "./reaction-picker"
import { ShareDialog } from "./share-dialog"
import { MediaViewer } from "./media-viewer"
import { IntentPrompt } from "./intent-prompt"
import { AIContextCard } from "./ai-context-card"
import { MatchActivityCard } from "./match-activity-card"
import { RequestReminderCard } from "./request-reminder-card"

const EMOJIS = ["😀", "😂", "🥰", "😍", "😭", "😊", "😎", "🔥", "✨", "🎉", "👍", "👎", "❤️", "🚀", "👀", "💯", "🤔", "👏", "🙌", "💀"]

const REACTION_MAP: Record<string, { label: string, icon: any, color: string }> = {
    "👍": { label: "Like", icon: ThumbsUp, color: "text-blue-600" },
    "❤️": { label: "Love", icon: Heart, color: "text-red-500" },
    "😂": { label: "Haha", icon: null, color: "text-yellow-500" },
    "😮": { label: "Wow", icon: null, color: "text-yellow-500" },
    "😢": { label: "Sad", icon: null, color: "text-yellow-500" },
    "😡": { label: "Angry", icon: null, color: "text-orange-500" },
}

interface MediaFile {
    file: File
    preview: string
    type: 'image' | 'video'
}

interface Post {
    id: number
    author: string
    role: string
    time: string
    content: string
    avatar: string
    initials: string
    postType?: "project-launch" | "teammate-request" | "announcement" | "general"
    hasMedia?: boolean
    mediaType?: 'image' | 'video'
    mediaUrl?: string
    hasLink?: boolean
    linkUrl?: string
    myReaction?: string | null
}

const DUMMY_POSTS: Post[] = [
    {
        id: 4,
        author: "Maria Rodriguez",
        role: "Startup Founder",
        time: "1h ago",
        content: "🚀 Just launched our beta! We're building an AI-powered study planner for students. Looking for a frontend developer and a marketing lead to join our core team. DM me if interested! #startup #teambuilding #edtech",
        avatar: "/avatars/05.png",
        initials: "MR",
        postType: "project-launch",
        hasMedia: false,
        myReaction: null
    },
    {
        id: 5,
        author: "James Patterson",
        role: "Backend Developer",
        time: "90min ago",
        content: "👋 Seeking a UI/UX designer for a fintech project I'm working on. Must have experience with Figma and designing for mobile apps. Part-time commitment for the next 8 weeks. Let's build something amazing together!",
        avatar: "/avatars/06.png",
        initials: "JP",
        postType: "teammate-request",
        hasMedia: false,
        myReaction: null
    },
    {
        id: 1,
        author: "Alex Johnson",
        role: "Product Designer",
        time: "2h ago",
        content: "Just launched a new feature for our collaborative workspace! 🚀 Super excited to see how teams use the new real-time whiteboard. #productdesign #collaboration #startup",
        avatar: "/avatars/02.png",
        initials: "AJ",
        postType: "general",
        hasMedia: true,
        mediaType: 'image',
        mediaUrl: "https://images.unsplash.com/photo-1531403009284-440f8804f1e9?auto=format&fit=crop&q=80&w=1000",
        hasLink: false,
        myReaction: null
    },
    {
        id: 2,
        author: "Sarah Miller",
        role: "Growth Lead",
        time: "4h ago",
        content: "Check out this interesting article about the future of remote work. @davidchen what do you think?",
        avatar: "/avatars/03.png",
        initials: "SM",
        postType: "general",
        hasMedia: false,
        hasLink: true,
        linkUrl: "https://example.com/remote-work-future",
        myReaction: null
    },
    {
        id: 3,
        author: "David Chen",
        role: "Full Stack Dev",
        time: "6h ago",
        content: "Refactoring the entire caching layer today. Coffee is my best friend right now. ☕️ #coding #devlife",
        avatar: "/avatars/04.png",
        initials: "DC",
        postType: "general",
        hasMedia: false,
        myReaction: null
    }
]

export function Feed() {
    const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS)
    const [content, setContent] = useState("")
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sort posts by priority: project-launch > teammate-request > announcement > general
    const sortedPosts = [...posts].sort((a, b) => {
        const priorityOrder = {
            "project-launch": 0,
            "teammate-request": 1,
            "announcement": 2,
            "general": 3
        }
        const aPriority = priorityOrder[a.postType || "general"]
        const bPriority = priorityOrder[b.postType || "general"]
        return aPriority - bPriority
    })

    // Helper function to get badge for post type
    const getPostTypeBadge = (postType?: string) => {
        switch (postType) {
            case "project-launch":
                return { label: "🚀 Project Launch", color: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" }
            case "teammate-request":
                return { label: "👥 Looking for Teammates", color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" }
            case "announcement":
                return { label: "📢 Announcement", color: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" }
            default:
                return null
        }
    }

    // Ecosystem States
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
    const [reactionPickerOpen, setReactionPickerOpen] = useState<number | null>(null)
    const [newPostsCount, setNewPostsCount] = useState(3) // Simulated new posts
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean, url: string }>({ isOpen: false, url: '' })
    const [mediaViewerState, setMediaViewerState] = useState<{ isOpen: boolean, url: string, type: 'image' | 'video' }>({ isOpen: false, url: '', type: 'image' })

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = (postId: number) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setReactionPickerOpen(postId)
    }

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = setTimeout(() => {
            setReactionPickerOpen(null)
        }, 1200) // 1.2s delay for smoother UX
    }

    const handleMediaClick = () => fileInputRef.current?.click()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video'
            }))
            setMediaFiles(prev => [...prev, ...newFiles])
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemoveMedia = (index: number) => {
        setMediaFiles(prev => {
            const newFiles = [...prev]
            URL.revokeObjectURL(newFiles[index].preview)
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    const toggleComments = (postId: number) => {
        const newSet = new Set(expandedComments)
        if (newSet.has(postId)) newSet.delete(postId)
        else newSet.add(postId)
        setExpandedComments(newSet)
    }

    const handleLoadMore = async () => {
        setIsLoadingMore(true)
        // Simulate fetch
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoadingMore(false)
    }

    const handleScrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setNewPostsCount(0)
    }

    const handleReaction = (postId: number, emoji: string) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, myReaction: emoji } : p
        ))
        setReactionPickerOpen(null)
    }

    const handleMainLike = (postId: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                // Toggle like (default to thumbs up if adding, null if removing)
                return { ...p, myReaction: p.myReaction ? null : "👍" }
            }
            return p
        }))
    }

    return (
        <div className="space-y-8 pb-10">
            <NewPostsIndicator
                count={newPostsCount}
                visible={newPostsCount > 0}
                onClick={handleScrollTop}
            />

            {/* Premium Create Post Widget - Collaboration Focused */}
            <div className="bg-card rounded-2xl shadow-sm border p-4 md:p-6 space-y-4">
                <div className="flex gap-4 items-start">
                    <Avatar className="h-11 w-11 md:h-12 md:w-12 ring-2 ring-background shadow-sm cursor-pointer transition-transform hover:scale-105">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <Textarea
                            placeholder="What are you trying to build?"
                            className="w-full resize-none border-none bg-transparent focus-visible:ring-0 min-h-[60px] text-lg md:text-xl p-0 placeholder:text-muted-foreground/50 leading-relaxed"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {/* Intent Chips */}
                        <IntentPrompt className="mt-3 mb-2" onSelectIntent={(id) => console.log('Selected intent:', id)} />

                        {mediaFiles.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {mediaFiles.map((media, index) => (
                                    <div key={index} className="relative flex-shrink-0 group">
                                        {media.type === 'image' ? (
                                            <img src={media.preview} alt="preview" className="h-24 w-24 object-cover rounded-lg border" />
                                        ) : (
                                            <video src={media.preview} className="h-24 w-24 object-cover rounded-lg border" />
                                        )}
                                        <button
                                            onClick={() => handleRemoveMedia(index)}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center -space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            className="h-9 px-3 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-full transition-colors group"
                            onClick={handleMediaClick}
                        >
                            <ImageIcon className="h-5 w-5 mr-2 text-blue-500 group-hover:text-blue-600" />
                            <span className="text-sm font-medium group-hover:text-blue-600">Media</span>
                        </Button>
                        <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10 rounded-full transition-colors group">
                            <Calendar className="h-5 w-5 mr-2 text-orange-500 group-hover:text-orange-600" />
                            <span className="text-sm font-medium group-hover:text-orange-600">Event</span>
                        </Button>
                        <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors group">
                            <FileText className="h-5 w-5 mr-2 text-red-500 group-hover:text-red-600" />
                            <span className="text-sm font-medium group-hover:text-red-600">Article</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto pl-2 md:pl-0 border-l md:border-none border-border/50 ml-auto md:ml-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary rounded-full">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="end">
                                <div className="grid grid-cols-5 gap-2">
                                    {EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            className="text-2xl hover:bg-muted p-1 rounded transition-colors"
                                            onClick={() => setContent(prev => prev + emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button className="rounded-full px-8 font-semibold shadow-lg transition-all">
                            Post
                        </Button>
                    </div>
                </div>
            </div>

            {/* AI Context Card */}
            <AIContextCard />

            {/* Match Activity Card - Shows recent collaboration signals */}
            <MatchActivityCard />

            {/* Request Reminder Card - Surfaces pending requests */}
            <RequestReminderCard pendingCount={2} />

            {/* AI Mentor Micro-Entry Point */}
            <Card className="border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Need help structuring your idea?
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Get personalized guidance from the AI Mentor
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900"
                    >
                        Ask AI Mentor →
                    </Button>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2">
                <div className="h-px bg-border flex-1" />
                <span className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</span>
                <div className="h-px bg-border flex-1" />
            </div>

            {/* Feed Posts */}
            <div className="space-y-6">
                {sortedPosts.map((post) => {
                    // Reaction State Calculation
                    const reactionConfig = post.myReaction ? REACTION_MAP[post.myReaction] : null
                    const ReactionIcon = reactionConfig?.icon || ThumbsUp
                    const postTypeBadge = getPostTypeBadge(post.postType)

                    return (
                        <div key={post.id} className="group bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="p-5 md:p-7">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-background shadow-sm">
                                            <AvatarImage src={post.avatar} />
                                            <AvatarFallback>{post.initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-base text-foreground hover:text-primary cursor-pointer transition-colors">{post.author}</h4>
                                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                {post.role}
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                {post.time}
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                <Globe className="h-3 w-3" />
                                            </p>
                                            {postTypeBadge && (
                                                <div className="mt-2">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                                        postTypeBadge.color
                                                    )}>
                                                        {postTypeBadge.label}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <PostOptionsDropdown isOwner={post.id === 3} />
                                </div>

                                {/* Content */}
                                <div className="pl-[4rem] -ml-4 md:ml-0 md:pl-16">
                                    <RichTextDisplay content={post.content} className="text-[15px] md:text-base leading-relaxed text-foreground/90 font-normal" />

                                    {post.hasLink && post.linkUrl && (
                                        <LinkPreview
                                            url={post.linkUrl}
                                            title="The Future of Remote Work: What You Need to Know"
                                            description="Explore the latest trends in distributed teams and asynchronous collaboration."
                                            siteName="techdaily.com"
                                        />
                                    )}

                                    {post.hasMedia && post.mediaUrl && (
                                        <div
                                            className="mt-4 rounded-xl overflow-hidden shadow-sm border bg-black/5 cursor-pointer relative group/image min-h-[200px]"
                                            onClick={() => setMediaViewerState({ isOpen: true, url: post.mediaUrl!, type: post.mediaType || 'image' })}
                                        >
                                            {/* Simple Image with Error Fallback Logic handled by standard img events or a wrapper in production. 
                                                For this demo, we use a standard img with a skeleton overlay while loading would require a separate component state. 
                                                We'll add a 'min-h-[200px]' and background to avoid layout shift if it fails. 
                                            */}
                                            <img
                                                src={post.mediaUrl}
                                                alt="Post content"
                                                className="w-full h-auto object-cover max-h-[500px]"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-muted');
                                                    // Create text node for error
                                                    const errorText = document.createElement('div');
                                                    errorText.className = "text-muted-foreground text-sm flex flex-col items-center gap-2";
                                                    errorText.innerHTML = '<svg class="h-8 w-8 opacity-50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span>Image failed to load</span>';
                                                    e.currentTarget.parentElement?.appendChild(errorText);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm">
                                                    Click to expand
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-5 pb-4 pt-2">
                                <div className="flex items-center justify-between border-t pt-3 relative">
                                    {/* Like / Reaction Group */}
                                    <div className="flex-1 relative group/reaction">
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full rounded-lg hover:bg-muted/50 transition-all gap-2 h-9",
                                                reactionConfig?.color || "text-muted-foreground hover:text-blue-500"
                                            )}
                                            onClick={() => handleMainLike(post.id)}
                                            onMouseEnter={() => handleMouseEnter(post.id)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {reactionConfig?.icon ? (
                                                <ReactionIcon className={cn("h-4 w-4", reactionConfig.color, "fill-current")} />
                                            ) : post.myReaction ? (
                                                <span className="text-lg leading-none">{post.myReaction}</span>
                                            ) : (
                                                <ThumbsUp className="h-4 w-4" />
                                            )}

                                            <span className="font-medium text-sm">
                                                {reactionConfig?.label || "Like"}
                                            </span>
                                        </Button>

                                        {reactionPickerOpen === post.id && (
                                            <div
                                                className="absolute bottom-full left-0 mb-2 z-20"
                                                onMouseEnter={() => handleMouseEnter(post.id)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <ReactionPicker
                                                    isOpen={true}
                                                    onSelect={(emoji) => handleReaction(post.id, emoji)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className="flex-1 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all gap-2 h-9"
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="font-medium text-sm">Comment</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        className="flex-1 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all gap-2 h-9"
                                        onClick={() => setShareDialogState({ isOpen: true, url: `https://collabryx.app/post/${post.id}` })}
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span className="font-medium text-sm">Share</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Collapsible Comments */}
                            {expandedComments.has(post.id) && (
                                <div className="animate-in slide-in-from-top-2 duration-200 px-5 sm:px-7">
                                    <CommentSection />
                                </div>
                            )}
                        </div>
                    )
                })}

                {isLoadingMore && <PostSkeleton />}
                <InfiniteScrollTrigger onLoadMore={handleLoadMore} hasMore={true} isLoading={isLoadingMore} />
            </div>

            <ShareDialog
                isOpen={shareDialogState.isOpen}
                onClose={() => setShareDialogState(prev => ({ ...prev, isOpen: false }))}
                postUrl={shareDialogState.url}
            />

            <MediaViewer
                isOpen={mediaViewerState.isOpen}
                onClose={() => setMediaViewerState(prev => ({ ...prev, isOpen: false }))}
                url={mediaViewerState.url}
                type={mediaViewerState.type}
            />
        </div>
    )
}
