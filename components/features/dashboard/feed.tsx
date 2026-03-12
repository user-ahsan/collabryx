"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getInitials } from "@/lib/utils/format-initials"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { sortPostsByPriority, getPostTypeBadge } from "@/lib/mock-data/dashboard"
import { fetchPosts } from "@/lib/services/posts"
import type { PostWithAuthor } from "@/types/database.types"

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
import { PostDetailDialog } from "./posts/post-detail-dialog"
import { AIContextCard } from "./ai-context-card"
import { RequestReminderModal } from "./request-reminder/RequestReminderModal"
import { GlassCard } from "@/components/shared/glass-card"

// Extended type for UI component with additional UI fields
interface PostUI extends PostWithAuthor {
    author: string
    role: string
    time: string
    avatar: string
    initials: string
    hasMedia: boolean
    mediaType?: "image" | "video"
    mediaUrls?: string[]
    hasLink: boolean
    linkUrl?: string
    myReaction: string | null
}

export function Feed() {
    const [posts, setPosts] = useState<PostUI[]>([])
    const [isFetching, setIsFetching] = useState(false)

    // ── API → Cache → Hardcoded Fallback ──
    const fetchPostsData = useCallback(async () => {
        setIsFetching(true)
        try {
            const { data, error } = await fetchPosts({ limit: 20 })

            if (error) throw error

            if (data && data.length > 0) {
                const mapped: PostUI[] = data.map((post) => ({
                    ...post,
                    author: post.author_name ?? "Unknown",
                    role: post.author_role ?? "",
                    time: post.time_ago ?? "",
                    avatar: post.author_avatar ?? "",
                    initials: getInitials(post.author_name, "U"),
                    hasMedia: Boolean(post.media_urls?.length || post.media_url),
                    mediaType: post.media_type,
                    mediaUrls: post.media_urls || (post.media_url ? [post.media_url] : undefined),
                    hasLink: Boolean(post.link_url),
                    linkUrl: post.link_url,
                    myReaction: null,
                }))
                setPosts(mapped)
                setCache(CACHE_KEYS.FEED_POSTS, mapped)
            }
        } catch {
            // API failed → try cache
            const cached = getCache<PostUI[]>(CACHE_KEYS.FEED_POSTS)
            if (cached) {
                setPosts(cached)
                toast.info("Couldn't load latest posts. Showing cached data.", {
                    id: "feed-cache-fallback",
                })
            }
        } finally {
            setIsFetching(false)
        }
    }, [])

    useEffect(() => {
        fetchPostsData()
    }, [fetchPostsData])

    // ── Memoized sort ──
    const sortedPosts = useMemo(() => sortPostsByPriority(posts), [posts])

    // ── Ecosystem States ──
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [newPostsCount, setNewPostsCount] = useState(3)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: "" })
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

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
                            <div key={post.id} className="relative">
                                {/* Clickable overlay for the whole card */}
                                <div
                                    className="absolute inset-0 z-0 cursor-pointer"
                                    onClick={() => setSelectedPostId(post.id)}
                                />
                                <PostCard className="relative z-10 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <PostHeader
                                            authorId={post.authorId}
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
                                    </div>
                                    <div className="pointer-events-auto">
                                        <PostContent
                                            content={post.content}
                                            hasLink={post.hasLink}
                                            linkUrl={post.linkUrl}
                                            hasMedia={post.hasMedia}
                                            mediaUrls={post.mediaUrls}
                                            mediaType={post.mediaType}
                                            onMediaExpanded={() => setSelectedPostId(post.id)}
                                            onPostClick={() => setSelectedPostId(post.id)}
                                            truncateText={true}
                                        />

                                    </div>

                                    <div className="pointer-events-auto">
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
                                    </div>
                                </PostCard>
                            </div>
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

            <PostDetailDialog
                isOpen={!!selectedPostId}
                onClose={() => setSelectedPostId(null)}
                post={sortedPosts.find(p => p.id === selectedPostId) || null}
                onLike={handleMainLike}
                onReaction={handleReaction}
                onShare={() => {
                    setShareDialogState({
                        isOpen: true,
                        url: `https://collabryx.app/post/${selectedPostId}`,
                    })
                }}
            />
        </div>
    )
}
