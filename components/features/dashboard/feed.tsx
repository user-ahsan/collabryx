"use client"

/**
 * Feed — Dashboard Activity Feed
 * 
 * REMOVED: AIContextCard ("Matching on Fintech / Python / MVP" card)
 * 
 * WHY IT WAS REMOVED:
 * The AIContextCard displayed hardcoded matching preferences ("Fintech interest",
 * "Python backend skills", "MVP-stage availability") that were not actually
 * derived from the user's profile data. These were fake preferences baked into
 * DEFAULT_CONTEXTS that had no connection to the user's actual skills,
 * interests, or collaboration goals entered during onboarding. Displaying this
 * as "Matching on..." was misleading because:
 *   1. The values were static strings, not computed from the user's data
 *   2. The "Edit" button had no real functionality behind it
 *   3. It took up vertical space in the feed with zero actionable value
 * 
 * THE PROBLEM IT CREATED:
 * New users would see "Matching on Fintech interest, Python backend skills,
 * MVP-stage availability" regardless of what they actually entered during
 * onboarding. A student with design skills looking for mentorship would still
 * see "Python backend" — which eroded trust in the platform's relevance.
 * 
 * Instead of keeping a broken component with fake data, it was fully deleted
 * including its file, import, and usage. If real matching context is needed
 * in the future, it should be computed from the user's actual skills,
 * interests, and collaboration preferences stored in the profiles table.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Button } from "@/components/ui/button"
import { Bot, Inbox, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils/format-initials"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { sortPostsByPriority, getPostTypeBadge } from "@/lib/utils/post-helpers"
import { fetchPosts, fetchPersonalizedFeed } from "@/lib/services/posts"
import { reactToPost, toggleBookmark } from "@/lib/actions/posts.server"
import type { PostWithAuthor } from "@/types/database.types"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

import { PostCard } from "./posts/post-card"
import { PostHeader } from "./posts/post-header"
import { PostContent } from "./posts/post-content"
import { PostActions } from "./posts/post-actions"
import { CreatePostModal } from "./create-post/create-post-modal"
import { PostSkeleton, PostSkeletonList } from "./posts/post-skeleton"
import { PullToRefresh } from "./posts/pull-to-refresh"
import { NewPostsIndicator } from "./posts/new-posts-indicator"
import { InfiniteScrollTrigger } from "./posts/infinite-scroll-trigger"
import { CommentSection } from "./comments/comment-section"
import { ShareDialog } from "./comments/share-dialog"
import { PostDetailDialog } from "./posts/post-detail-dialog"
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
    isBookmarked: boolean
}

export function Feed() {
    const prefersReduced = useReducedMotion()
    const { user: currentUser } = useAuth()
    // Check if user has completed embedding (for banner display only)
    const [hasEmbedding, setHasEmbedding] = useState<boolean | null>(null)
    
    // Posts state for infinite scroll
    const [posts, setPosts] = useState<PostUI[]>([])
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [fetchError, setFetchError] = useState<Error | null>(null)

    // Map raw API data to UI format
    const mapPostToUI = useCallback((post: PostWithAuthor): PostUI => ({
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
        isBookmarked: false,
    }), [])

    // Fetch initial posts
    const fetchInitialPosts = useCallback(async () => {
        setIsInitialLoading(true)
        try {
            const result = hasEmbedding
                ? await fetchPersonalizedFeed({ limit: 20 })
                : await fetchPosts({ limit: 20, random: false })

            // Personalized feed gracefully falls back to chronological on error
            if (result.error) {
                console.warn("Feed: using fallback feed, personalization not ready:", result.error.message)
            }
            
            const data = result.data
            if (data && data.length > 0) {
                const mapped = data.map(mapPostToUI)
                setPosts(mapped)
                setCache(CACHE_KEYS.FEED_POSTS, mapped)
                setHasMore(data.length === 20)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching posts:', error)
            setFetchError(error instanceof Error ? error : new Error('Failed to fetch posts'))
            // Fallback to cache
            const cached = getCache<PostUI[]>(CACHE_KEYS.FEED_POSTS)
            if (cached) {
                setPosts(cached)
                toast.info("Couldn't load latest posts. Showing cached data.", {
                    id: "feed-cache-fallback",
                })
            }
        } finally {
            setIsInitialLoading(false)
        }
    }, [mapPostToUI, hasEmbedding])

    // Fetch initial posts when embedding status is known
    useEffect(() => {
        if (hasEmbedding !== null && posts.length === 0) {
            fetchInitialPosts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasEmbedding, fetchInitialPosts])

    // Stable sort to prevent reordering flickers
    const sortedPosts = useMemo(() => {
        if (posts.length === 0) return []
        return sortPostsByPriority(posts)
    }, [posts])

    // Check embedding status on mount (for banner only, doesn't block rendering)
    useEffect(() => {
        const checkEmbeddingStatus = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) {
                    setHasEmbedding(false)
                    return
                }

                const { data: embedding } = await supabase
                    .from("profile_embeddings")
                    .select("status")
                    .eq("user_id", user.id)
                    .single()

                setHasEmbedding(embedding?.status === 'completed')
            } catch (error) {
                console.error('Error checking embedding status:', error)
                setHasEmbedding(false)
            }
        }
        
        checkEmbeddingStatus()
    }, [])

    /** Fetch bookmark status for a set of posts and update state */
    const fetchBookmarkStatus = useCallback(async (targetPosts: PostUI[]) => {
        if (targetPosts.length === 0) return
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const postIds = targetPosts.map(p => p.id)
            const { data: bookmarks } = await supabase
                .from("user_bookmarks")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", postIds)

            if (bookmarks) {
                const ids = new Set(bookmarks.map(b => b.post_id))
                setBookmarkedPostIds(ids)
                setPosts(prev => prev.map(p => ({
                    ...p,
                    isBookmarked: ids.has(p.id)
                })))
            }
        } catch (err) {
            console.error("Error fetching bookmarks:", err)
        }
    }, [])

    // Fetch bookmarks when the posts list changes
    useEffect(() => {
        if (posts.length === 0) return
        fetchBookmarkStatus(posts)
    }, [posts.length, fetchBookmarkStatus])

    // â”€â”€ Ecosystem States â”€â”€
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [newPostsCount, setNewPostsCount] = useState(0)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: "" })
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set())
    const latestCreatedAtRef = useRef<string | null>(null)
    const hasCheckedNewPosts = useRef(false)

    useEffect(() => {
        const handleScroll = async () => {
            if (hasCheckedNewPosts.current || !latestCreatedAtRef.current) return

            const scrollY = window.scrollY
            const threshold = window.innerHeight * 0.8
            if (scrollY < threshold) return

            hasCheckedNewPosts.current = true

            try {
                const supabase = createClient()
                const { count, error } = await supabase
                    .from("posts")
                    .select("id", { count: "exact", head: true })
                    .gt("created_at", latestCreatedAtRef.current)
                    .is("is_archived", false)

                if (!error && count && count > 0) {
                    setNewPostsCount(count)
                }
            } catch {
                // Silently fail - no auto-refresh, only manual
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Record latest post timestamp when posts load
    useEffect(() => {
        if (posts.length > 0 && !latestCreatedAtRef.current) {
            const withDates = posts.filter(p => p.created_at)
            if (withDates.length > 0) {
                latestCreatedAtRef.current = withDates.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0].created_at
            }
        }
    }, [posts])

    const toggleComments = (postId: string) => {
        const newSet = new Set(expandedComments)
        if (newSet.has(postId)) newSet.delete(postId)
        else newSet.add(postId)
        setExpandedComments(newSet)
    }

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return
        
        setIsLoadingMore(true)
        const newOffset = offset + 20
        
        try {
            const { data, error } = hasEmbedding
                ? await fetchPersonalizedFeed({ limit: 20, offset: newOffset })
                : await fetchPosts({ limit: 20, offset: newOffset, random: false })

            if (error) {
                console.warn("Feed: loadMore fallback, personalization not ready:", error.message)
            }
            
            if (data && data.length > 0) {
                const mapped = data.map(mapPostToUI)
                setPosts(prev => [...prev, ...mapped])
                setOffset(newOffset)
                setHasMore(data.length === 20)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading more posts:', error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    const handleNewPostsClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        setNewPostsCount(0)
        hasCheckedNewPosts.current = false
        if (posts.length > 0) {
            const withDates = posts.filter(p => p.created_at)
            if (withDates.length > 0) {
                latestCreatedAtRef.current = withDates.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0].created_at
            }
        }
    }

    /** Refresh the feed from scratch — resets pagination and re-fetches */
    const handleRefresh = useCallback(async () => {
        // Reset pagination state
        setOffset(0)
        setHasMore(true)
        setNewPostsCount(0)
        hasCheckedNewPosts.current = false
        setSelectedPostId(null)

        // Re-fetch from the beginning
        setIsInitialLoading(true)
        try {
            const result = hasEmbedding
                ? await fetchPersonalizedFeed({ limit: 20 })
                : await fetchPosts({ limit: 20, random: false })

            if (result.error) {
                console.warn("Feed: refresh fallback, personalization not ready:", result.error.message)
            }

            const data = result.data
            let mapped: PostUI[] = []
            if (data && data.length > 0) {
                mapped = data.map(mapPostToUI)
                setPosts(mapped)
                setCache(CACHE_KEYS.FEED_POSTS, mapped)
                setHasMore(data.length === 20)

                // Update latest timestamp for new-post detection
                const withDates = mapped.filter(p => p.created_at)
                if (withDates.length > 0) {
                    latestCreatedAtRef.current = withDates.sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0].created_at
                }
            } else {
                setHasMore(false)
            }

            // Re-fetch bookmark status
            await fetchBookmarkStatus(mapped)
        } catch (error) {
            console.error('Error refreshing feed:', error)
            const cached = getCache<PostUI[]>(CACHE_KEYS.FEED_POSTS)
            if (cached) {
                setPosts(cached)
                toast.info("Couldn't refresh. Showing cached data.", {
                    id: "feed-refresh-fallback",
                })
            }
        } finally {
            setIsInitialLoading(false)
        }
    }, [mapPostToUI, hasEmbedding])

    /** Show a collaborate toast when reacting to someone else's post */
    const showCollaborateToast = useCallback((post: PostUI) => {
        if (!currentUser || post.author_id === currentUser.id) return
        toast("Want to collaborate?", {
            description: `See what you can build with ${post.author}`,
            action: {
                label: "Explore Ideas",
                onClick: () => window.location.href = `/ai-mentor?collaborate=${post.author_id}`,
            },
            duration: 8000,
        })
    }, [currentUser])

    const handleReaction = async (postId: string, emoji: string) => {
        const post = posts.find(p => p.id === postId)

        // Show collaborate toast if reacting to someone else's post
        if (post && emoji === 'like') {
            showCollaborateToast(post)
        }

        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, myReaction: p.myReaction === emoji ? null : emoji } : p
        ))

        try {
            const result = await reactToPost(postId, emoji)
            if (result.error) {
                // Revert on failure
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, myReaction: null } : p
                ))
                toast.error(result.error)
            }
        } catch {
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, myReaction: null } : p
            ))
            toast.error("Failed to add reaction")
        }
    }

    const handleMainLike = async (postId: string) => {
        const post = posts.find(p => p.id === postId)
        const currentReaction = post?.myReaction
        const newEmoji = currentReaction === 'like' ? null : 'like'

        // Show collaborate toast if liking someone else's post
        if (post && newEmoji === 'like') {
            showCollaborateToast(post)
        }

        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, myReaction: newEmoji } : p
        ))

        try {
            const result = await reactToPost(postId, 'like')
            if (result.error) {
                // Revert on failure
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, myReaction: currentReaction ?? null } : p
                ))
                toast.error(result.error)
            }
        } catch {
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, myReaction: currentReaction ?? null } : p
            ))
            toast.error("Failed to like post")
        }
    }

    const handleBookmark = async (postId: string) => {
        const wasBookmarked = bookmarkedPostIds.has(postId)

        // Optimistic update
        setBookmarkedPostIds(prev => {
            const next = new Set(prev)
            if (wasBookmarked) next.delete(postId)
            else next.add(postId)
            return next
        })
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, isBookmarked: !wasBookmarked } : p
        ))

        try {
            const result = await toggleBookmark(postId)
            if (result.error) {
                // Revert on failure
                setBookmarkedPostIds(prev => {
                    const next = new Set(prev)
                    if (wasBookmarked) next.add(postId)
                    else next.delete(postId)
                    return next
                })
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, isBookmarked: wasBookmarked } : p
                ))
                toast.error(result.error)
            } else {
                toast.success(result.bookmarked ? "Post saved" : "Bookmark removed")
            }
        } catch {
            // Revert on failure
            setBookmarkedPostIds(prev => {
                const next = new Set(prev)
                if (wasBookmarked) next.add(postId)
                else next.delete(postId)
                return next
            })
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, isBookmarked: wasBookmarked } : p
            ))
            toast.error("Failed to update bookmark")
        }
    }

    const [isRefreshing, setIsRefreshing] = useState(false)

    const triggerRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            await handleRefresh()
        } finally {
            setIsRefreshing(false)
        }
    }, [handleRefresh])

    return (
        <PullToRefresh onRefresh={triggerRefresh}>
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6 lg:space-y-8 pb-6 md:pb-8">
            <NewPostsIndicator
                count={newPostsCount}
                visible={newPostsCount > 0}
                onClick={handleNewPostsClick}
            />

            {/* Refresh button for desktop users */}
            <div className="flex items-center justify-end -mb-2 md:-mb-4">
                <button
                    onClick={triggerRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                    aria-label="Refresh feed"
                    title="Refresh feed"
                >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </button>
            </div>

            <CreatePostModal />

            {/* Embedding Status Banner */}
            {hasEmbedding === false && (
                <GlassCard innerClassName="p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground">
                                Personalizing your feed
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                We&apos;re analyzing your profile to show you relevant content.
                                Meanwhile, here are some popular posts from the community.
                            </p>
                        </div>
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 mt-1" />
                    </div>
                </GlassCard>
            )}

            {/* Request Reminder Card */}
            <RequestReminderModal />

            {/* AI Mentor Micro-Entry Point */}
            <GlassCard innerClassName="p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                            Need help structuring your idea?
                        </h3>
                        <p className="text-sm text-muted-foreground leading-snug">
                            Get personalized guidance from the AI Mentor
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-sm font-medium w-full sm:w-auto shrink-0"
                >
                    Ask AI Mentor
                </Button>
            </GlassCard>

            {/* Feed Posts */}
            <div className="space-y-4 md:space-y-6" role="feed" aria-label="Posts feed">
                {isInitialLoading && sortedPosts.length === 0 ? (
                    <PostSkeletonList count={5} />
                ) : fetchError && sortedPosts.length === 0 ? (
                    /* Error State - Fallback to Cache */
                    <GlassCard innerClassName="py-16 sm:py-20 px-6 sm:px-8 text-center">
                        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="h-8 w-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Unable to load posts
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Please check your connection and try again.
                        </p>
                    </GlassCard>
                ) : sortedPosts.length === 0 ? (
                    /* Empty State */
                    <GlassCard innerClassName="py-16 sm:py-20 px-6 sm:px-8 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            No posts yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Be the first to share something with the community. Start a
                            conversation or announce your project.
                        </p>
                    </GlassCard>
                ) : (
                    sortedPosts.map((post, index) => {
                        const postTypeBadge = getPostTypeBadge(post.post_type)

                        return (
                            <motion.div key={post.id} initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: prefersReduced ? 0 : Math.min(index * 0.04, 0.6), duration: prefersReduced ? 0 : 0.3, ease: "easeOut" }} className="relative">
                                {/* Clickable overlay for the whole card */}
                                <div
                                    className="absolute inset-0 z-0 cursor-pointer"
                                    onClick={() => setSelectedPostId(post.id)}
                                />
                                <PostCard className="relative z-10 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <PostHeader
                                            authorId={post.author_id}
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
                                                            postTypeBadge.className
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
                                            isBookmarked={post.isBookmarked}
                                            onLike={handleMainLike}
                                            onReaction={handleReaction}
                                            onCommentClick={toggleComments}
                                            onBookmark={handleBookmark}
                                            onShareClick={() =>
                                                setShareDialogState({
                                                    isOpen: true,
                                                    url: `https://collabryx.app/post/${post.id}`,
                                                })
                                            }
                                        />

{/* Collapsible Comments */}
{expandedComments.has(post.id) && (
    <div
        className="animate-in slide-in-from-top-2 duration-200 px-4 max-h-[500px] overflow-y-auto overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
    >
        <CommentSection postId={post.id} />
    </div>
)}
                                    </div>
                                </PostCard>
                            </motion.div>
                        )
                    })
                )}

                {isLoadingMore && <PostSkeleton variant="withoutMedia" />}
                <InfiniteScrollTrigger
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
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
                onBookmark={handleBookmark}
                onShare={() => {
                    setShareDialogState({
                        isOpen: true,
                        url: `https://collabryx.app/post/${selectedPostId}`,
                    })
                }}
            />
        </div>
        </PullToRefresh>
    )
}
