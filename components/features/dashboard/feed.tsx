"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import {
    MOCK_POSTS,
    sortPostsByPriority,
    getPostTypeBadge,
} from "@/lib/mock-data/dashboard"
import type { Post } from "@/lib/mock-data/dashboard"

import { PostCard } from "./posts/post-card"
import { PostHeader } from "./posts/post-header"
import { PostContent } from "./posts/post-content"
import { PostActions } from "./posts/post-actions"
import { CreatePostModal } from "./create-post/create-post-modal"
import { PostSkeleton } from "./posts/post-skeleton"
import { NewPostsIndicator } from "./posts/new-posts-indicator"
import { InfiniteScrollTrigger } from "./posts/infinite-scroll-trigger"
import { CommentSection } from "./comments/comment-section"
import { ShareDialog } from "./comments/share-dialog"
import { MediaViewer } from "./posts/media-viewer"
import { AIContextCard } from "./ai-context-card"
import { RequestReminderModal } from "./request-reminder/RequestReminderModal"
import { GlassCard } from "@/components/shared/glass-card"

export function Feed() {
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS)
    const [isFetching, setIsFetching] = useState(false)

    // ── API → Cache → Hardcoded Fallback ──
    const fetchPosts = useCallback(async () => {
        setIsFetching(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data, error } = await supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20)

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: Post[] = data.map((r: Record<string, unknown>) => ({
                    id: String(r.id),
                    author: String(r.author_name ?? "Unknown"),
                    role: String(r.author_role ?? ""),
                    time: String(r.time_ago ?? ""),
                    content: String(r.content ?? ""),
                    avatar: String(r.author_avatar ?? ""),
                    initials: String(r.author_name ?? "U").slice(0, 2).toUpperCase(),
                    postType: (r.post_type as Post["postType"]) || "general",
                    hasMedia: Boolean(r.media_url),
                    mediaType: (r.media_type as Post["mediaType"]) || undefined,
                    mediaUrl: r.media_url ? String(r.media_url) : undefined,
                    hasLink: Boolean(r.link_url),
                    linkUrl: r.link_url ? String(r.link_url) : undefined,
                    myReaction: null,
                }))
                setPosts(mapped)
                setCache(CACHE_KEYS.FEED_POSTS, mapped)
            }
        } catch {
            // API failed → try cache → fallback to hardcoded
            const cached = getCache<Post[]>(CACHE_KEYS.FEED_POSTS)
            if (cached) {
                setPosts(cached)
                toast.info("Couldn\u2019t load latest posts. Showing cached data.", {
                    id: "feed-cache-fallback",
                })
            } else {
                setPosts(MOCK_POSTS)
            }
        } finally {
            setIsFetching(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    // ── Memoized sort ──
    const sortedPosts = useMemo(() => sortPostsByPriority(posts), [posts])

    // ── Ecosystem States ──
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [newPostsCount, setNewPostsCount] = useState(3)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: "" })
    const [mediaViewerState, setMediaViewerState] = useState<{ isOpen: boolean; url: string; type: "image" | "video" }>({ isOpen: false, url: "", type: "image" })

    const toggleComments = (postId: string) => {
        const newSet = new Set(expandedComments)
        if (newSet.has(postId)) newSet.delete(postId)
        else newSet.add(postId)
        setExpandedComments(newSet)
    }

    const handleLoadMore = async () => {
        setIsLoadingMore(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setIsLoadingMore(false)
    }

    const handleScrollTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        setNewPostsCount(0)
    }

    const handleReaction = (postId: string, emoji: string) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, myReaction: emoji } : p))
        )
    }

    const handleMainLike = (postId: string) => {
        setPosts((prev) =>
            prev.map((p) => {
                if (p.id === postId) {
                    return { ...p, myReaction: p.myReaction ? null : "👍" }
                }
                return p
            })
        )
    }

    return (
        <div className="space-y-3 md:space-y-6 lg:space-y-8 pb-6 md:pb-10">
            <NewPostsIndicator
                count={newPostsCount}
                visible={newPostsCount > 0}
                onClick={handleScrollTop}
            />

            <CreatePostModal />

            {/* AI Context Card */}
            <AIContextCard />

            {/* Request Reminder Card */}
            <RequestReminderModal />

            {/* AI Mentor Micro-Entry Point */}
            <GlassCard innerClassName="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0 border border-purple-500/20">
                        <Bot className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">
                            Need help structuring your idea?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Get personalized guidance from the AI Mentor
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-sm font-medium border-white/[0.08] hover:bg-white/[0.04] w-full sm:w-auto shrink-0"
                >
                    Ask AI Mentor →
                </Button>
            </GlassCard>

            <div className="flex items-center justify-between px-1 md:px-2">
                <div className="h-px bg-border flex-1" />
                <span className="px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Activity
                </span>
                <div className="h-px bg-border flex-1" />
            </div>

            {/* Feed Posts */}
            <div className="space-y-3 md:space-y-6" role="feed" aria-label="Posts feed">
                {isFetching && sortedPosts.length === 0 ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : sortedPosts.length === 0 ? (
                    /* Empty State */
                    <GlassCard innerClassName="py-16 px-6 text-center">
                        <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="h-8 w-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            No posts yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Be the first to share something with the community! Start a
                            conversation or announce your project.
                        </p>
                    </GlassCard>
                ) : (
                    sortedPosts.map((post) => {
                        const postTypeBadge = getPostTypeBadge(post.postType)

                        return (
                            <PostCard key={post.id}>
                                <PostHeader
                                    author={post.author}
                                    role={post.role}
                                    time={post.time}
                                    avatar={post.avatar}
                                    initials={post.initials}
                                    postTypeBadge={
                                        postTypeBadge ? (
                                            <span
                                                className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold border",
                                                    postTypeBadge.color
                                                )}
                                            >
                                                {postTypeBadge.label}
                                            </span>
                                        ) : null
                                    }
                                    isOwner={post.id === "post-3"}
                                />

                                <PostContent
                                    content={post.content}
                                    hasLink={post.hasLink}
                                    linkUrl={post.linkUrl}
                                    hasMedia={post.hasMedia}
                                    mediaUrl={post.mediaUrl}
                                    mediaType={post.mediaType}
                                    onMediaExpanded={() =>
                                        setMediaViewerState({
                                            isOpen: true,
                                            url: post.mediaUrl!,
                                            type: post.mediaType || "image",
                                        })
                                    }
                                />

                                <PostActions
                                    postId={post.id}
                                    myReaction={post.myReaction}
                                    onLike={handleMainLike}
                                    onReaction={handleReaction}
                                    onCommentClick={toggleComments}
                                    onShareClick={() =>
                                        setShareDialogState({
                                            isOpen: true,
                                            url: `https://collabryx.app/post/${post.id}`,
                                        })
                                    }
                                />

                                {/* Collapsible Comments */}
                                {expandedComments.has(post.id) && (
                                    <div className="animate-in slide-in-from-top-2 duration-200 px-2 sm:px-4">
                                        <CommentSection />
                                    </div>
                                )}
                            </PostCard>
                        )
                    })
                )}

                {isLoadingMore && <PostSkeleton />}
                <InfiniteScrollTrigger
                    onLoadMore={handleLoadMore}
                    hasMore={true}
                    isLoading={isLoadingMore}
                />
            </div>

            <ShareDialog
                isOpen={shareDialogState.isOpen}
                onClose={() =>
                    setShareDialogState((prev) => ({ ...prev, isOpen: false }))
                }
                postUrl={shareDialogState.url}
            />

            <MediaViewer
                isOpen={mediaViewerState.isOpen}
                onClose={() =>
                    setMediaViewerState((prev) => ({ ...prev, isOpen: false }))
                }
                url={mediaViewerState.url}
                type={mediaViewerState.type}
            />
        </div>
    )
}
