"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    MoreHorizontal,
    Heart,
    MessageCircle,
    Share2,
    Globe,
    ThumbsUp,
    Bot,
    Laugh,
    Flame,
    Frown,
    Angry,
    Rocket,
    UserPlus,
    Megaphone
} from "lucide-react"
import { cn } from "@/lib/utils"

import { PostCard } from "./posts/post-card"
import { PostHeader } from "./posts/post-header"
import { PostContent } from "./posts/post-content"
import { PostActions } from "./posts/post-actions"
import { CreatePostModal } from "./create-post/create-post-modal"
import { PostOptionsDropdown } from "./posts/post-options-dropdown"
import { RichTextDisplay } from "./posts/rich-text-display"
import { LinkPreview } from "./posts/link-preview"
import { PostSkeleton } from "./posts/post-skeleton"
import { NewPostsIndicator } from "./posts/new-posts-indicator"
import { InfiniteScrollTrigger } from "./posts/infinite-scroll-trigger"
import { CommentSection } from "./comments/comment-section"
import { ReactionPicker } from "./comments/reaction-picker"
import { ShareDialog } from "./comments/share-dialog"
import { MediaViewer } from "./posts/media-viewer"
import { IntentPrompt } from "./intent-prompt"
import { AIContextCard } from "./ai-context-card"
import { MatchActivityCard } from "./match-activity-card"
import { RequestReminderCard } from "./request-reminder-card"



const REACTION_MAP: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    "like": { label: "Like", icon: ThumbsUp, color: "text-blue-600" },
    "love": { label: "Love", icon: Heart, color: "text-red-500" },
    "haha": { label: "Haha", icon: Laugh, color: "text-yellow-500" },
    "wow": { label: "Wow", icon: Flame, color: "text-orange-500" },
    "sad": { label: "Sad", icon: Frown, color: "text-blue-400" },
    "angry": { label: "Angry", icon: Angry, color: "text-red-600" },
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
                return { label: "Project Launch", icon: Rocket, color: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" }
            case "teammate-request":
                return { label: "Looking for Teammates", icon: UserPlus, color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" }
            case "announcement":
                return { label: "Announcement", icon: Megaphone, color: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" }
            default:
                return null
        }
    }

    // Ecosystem States
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
    const [newPostsCount, setNewPostsCount] = useState(3) // Simulated new posts
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean, url: string }>({ isOpen: false, url: '' })
    const [mediaViewerState, setMediaViewerState] = useState<{ isOpen: boolean, url: string, type: 'image' | 'video' }>({ isOpen: false, url: '', type: 'image' })

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
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, myReaction: emoji } : p
        ))
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
        <div className="space-y-4 md:space-y-6 lg:space-y-8 pb-6 md:pb-10">
            <NewPostsIndicator
                count={newPostsCount}
                visible={newPostsCount > 0}
                onClick={handleScrollTop}
            />

            <CreatePostModal />

            {/* AI Context Card */}
            <AIContextCard />

            {/* Match Activity Card - Shows recent collaboration signals */}
            <MatchActivityCard />

            {/* Request Reminder Card - Surfaces pending requests */}
            <RequestReminderCard pendingCount={2} />

            {/* AI Mentor Micro-Entry Point */}
            <Card className="border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 shadow-sm">
                <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
                            <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                                Need help structuring your idea?
                            </h3>
                            <p className="text-[11px] sm:text-xs text-muted-foreground">
                                Get personalized guidance from the AI Mentor
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 px-3 text-xs font-medium border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 w-full sm:w-auto shrink-0"
                    >
                        Ask AI Mentor →
                    </Button>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between px-1 md:px-2">
                <div className="h-px bg-border flex-1" />
                <span className="px-3 md:px-4 text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</span>
                <div className="h-px bg-border flex-1" />
            </div>

            {/* Feed Posts */}
            <div className="space-y-4 md:space-y-6">
                {sortedPosts.map((post) => {
                    const postTypeBadge = getPostTypeBadge(post.postType)

                    return (
                        <PostCard key={post.id}>
                            <PostHeader
                                author={post.author}
                                role={post.role}
                                time={post.time}
                                avatar={post.avatar}
                                initials={post.initials}
                                postTypeBadge={postTypeBadge ? (
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs md:text-[10px] font-semibold border",
                                        postTypeBadge.color
                                    )}>
                                        {postTypeBadge.label}
                                    </span>
                                ) : null}
                                isOwner={post.id === 3}
                            />

                            <PostContent
                                content={post.content}
                                hasLink={post.hasLink}
                                linkUrl={post.linkUrl}
                                hasMedia={post.hasMedia}
                                mediaUrl={post.mediaUrl}
                                mediaType={post.mediaType}
                                onMediaExpanded={() => setMediaViewerState({ isOpen: true, url: post.mediaUrl!, type: post.mediaType || 'image' })}
                            />

                            <PostActions
                                postId={post.id}
                                myReaction={post.myReaction}
                                onLike={handleMainLike}
                                onReaction={handleReaction}
                                onCommentClick={toggleComments}
                                onShareClick={() => setShareDialogState({ isOpen: true, url: `https://collabryx.app/post/${post.id}` })}
                            />

                            {/* Collapsible Comments */}
                            {expandedComments.has(post.id) && (
                                <div className="animate-in slide-in-from-top-2 duration-200 px-2 sm:px-4">
                                    <CommentSection />
                                </div>
                            )}
                        </PostCard>
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
