"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Inbox, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils/format-initials"
import { getCache, setCache, CACHE_KEYS } from "@/lib/dashboard-cache"
import { sortPostsByPriority, getPostTypeBadge } from "@/lib/utils/post-helpers"
import { fetchPosts } from "@/lib/services/posts"
import type { PostWithAuthor } from "@/types/database.types"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

import { PostCard } from "./posts/post-card"
import { PostHeader } from "./posts/post-header"
import { PostContent } from "./posts/post-content"
import { PostActions } from "./posts/post-actions"
import { CreatePostModal } from "./create-post/create-post-modal"
import { PostSkeleton, PostSkeletonList } from "./posts/post-skeleton"
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
    }), [])

    // Fetch initial posts
    const fetchInitialPosts = useCallback(async () => {
        setIsInitialLoading(true)
        try {
            const { data, error } = await fetchPosts({ 
                limit: 20,
                random: hasEmbedding === false
            })
            
            if (error) throw error
            
            if (data && data.length > 0) {
                const mapped = data.map(mapPostToUI)
                setPosts(mapped)
                setCache(CACHE_KEYS.FEED_POSTS, mapped)
                setHasMore(data.length === 20)
            } else {
                setHasMore(false)
            }
        } catch (err) {
            console.error('Error fetching posts:', err)
            setFetchError(err instanceof Error ? err : new Error('Failed to fetch posts'))
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

    // ── Ecosystem States ──
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [newPostsCount, setNewPostsCount] = useState(3)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [shareDialogState, setShareDialogState] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: "" })
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

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
            const { data, error } = await fetchPosts({ 
                limit: 20,
                offset: newOffset,
                random: hasEmbedding === false
            })
            
            if (error) throw error
            
            if (data && data.length > 0) {
                const mapped = data.map(mapPostToUI)
                setPosts(prev => [...prev, ...mapped])
                setOffset(newOffset)
                setHasMore(data.length === 20) // If we got less than 20, no more posts
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading more posts:', error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    const handleScrollTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        setNewPostsCount(0)
    }

    const handleReaction = (postId: string, emoji: string) => {
        // Optimistic update - in production, this would call a mutation
        const postElement = document.querySelector(`[data-post-id="${postId}"]`)
        if (postElement) {
            postElement.setAttribute('data-reaction', emoji)
        }
        toast.success(`Reaction added: ${emoji}`)
    }

    const handleMainLike = (postId: string) => {
        // Optimistic update - in production, this would call a mutation
        const postElement = document.querySelector(`[data-post-id="${postId}"]`)
        if (postElement) {
            const currentReaction = postElement.getAttribute('data-reaction')
            postElement.setAttribute('data-reaction', currentReaction ? '' : '👍')
        }
    }

    return (
        <div className="space-y-4 md:space-y-6 lg:space-y-8 pb-6 md:pb-8">
            <NewPostsIndicator
                count={newPostsCount}
                visible={newPostsCount > 0}
                onClick={handleScrollTop}
            />

            <CreatePostModal />

            {/* Embedding Status Banner */}
            {hasEmbedding === false && (
                <GlassCard innerClassName="p-4 bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                Personalizing your feed
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                We&apos;re analyzing your profile to show you relevant content. 
                                Meanwhile, here are some popular posts from the community!
                            </p>
                        </div>
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    </div>
                </GlassCard>
            )}

            {/* AI Context Card */}
            <AIContextCard />

            {/* Request Reminder Card */}
            <RequestReminderModal />

            {/* AI Mentor Micro-Entry Point */}
            <GlassCard innerClassName="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
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

            <div className="flex items-center justify-between px-2 md:px-4">
                <div className="h-px bg-border flex-1" />
                <span className="px-4 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Activity
                </span>
                <div className="h-px bg-border flex-1" />
            </div>

            {/* Feed Posts */}
            <div className="space-y-4 md:space-y-6" role="feed" aria-label="Posts feed">
                {isInitialLoading && sortedPosts.length === 0 ? (
                    <PostSkeletonList count={5} />
                ) : fetchError && sortedPosts.length === 0 ? (
                    /* Error State - Fallback to Cache */
                    <GlassCard innerClassName="py-16 px-6 text-center">
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
                        const postTypeBadge = getPostTypeBadge(post.post_type)

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
    <div className="animate-in slide-in-from-top-2 duration-200 px-4">
        <CommentSection postId={post.id} />
    </div>
)}
                                    </div>
                                </PostCard>
                            </div>
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
