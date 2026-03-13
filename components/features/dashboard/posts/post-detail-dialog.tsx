"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Post, getPostTypeBadge } from "@/lib/mock-data/dashboard"
import { PostHeader } from "./post-header"
import { PostContent } from "./post-content"
import { PostActions } from "./post-actions"
import { CommentSection } from "../comments/comment-section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface PostDetailDialogProps {
    isOpen: boolean
    onClose: () => void
    post: Post | null
    onLike?: (postId: string) => void
    onReaction?: (postId: string, emoji: string) => void
    onShare?: () => void
}

export function PostDetailDialog({
    isOpen,
    onClose,
    post,
    onLike,
    onReaction,
    onShare,
}: PostDetailDialogProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Reset index when post changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentIndex(0)
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0 })
        }
    }, [post?.id])

    if (!post) return null

    const postTypeBadge = getPostTypeBadge(post.postType)
    const hasMedia = post.hasMedia && post.mediaUrls && post.mediaUrls.length > 0

    const handleScroll = () => {
        if (!scrollContainerRef.current) return
        const scrollLeft = scrollContainerRef.current.scrollLeft
        const width = scrollContainerRef.current.offsetWidth
        const newIndex = Math.round(scrollLeft / width)
        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex)
        }
    }

    const scrollToIndex = (index: number) => {
        if (!scrollContainerRef.current || !post.mediaUrls) return
        const width = scrollContainerRef.current.offsetWidth
        scrollContainerRef.current.scrollTo({
            left: width * index,
            behavior: "smooth"
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={cn(
                    "p-0 border-none rounded-none overflow-hidden outline-none transition-all duration-300 overscroll-contain",
                    hasMedia
                        ? "max-w-[100vw] h-[100dvh] flex flex-col md:flex-row md:max-w-[1200px] xl:max-w-[1400px] md:h-[90vh] md:rounded-xl md:border md:border-white/10"
                        : "w-full max-w-[100vw] h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl lg:max-w-3xl flex flex-col md:rounded-xl md:border md:border-white/10"
                )}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
            >
                <DialogTitle className="sr-only">Viewing Post by {post.author}</DialogTitle>

                {hasMedia ? (
                    // ─── Dual-Column Layout (Media Posts) ───
                    <GlassCard className="w-full h-full" innerClassName="flex flex-col md:flex-row w-full h-full">
                        <div className={cn(
                            "w-full min-h-[40vh] md:h-full md:w-[65%] lg:w-[70%] xl:w-[72%] flex flex-col justify-center relative border-b md:border-b-0 md:border-r group/media overflow-hidden",
                            glass("mediaOverlay"),
                            "border-b border-blue-400/10"
                        )}>
                            {/* CSS Snap Carousel for media in the dialog */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {post.mediaUrls?.map((url, i) => (
                                    <div key={url} className="min-w-full h-full flex items-center justify-center snap-center shrink-0 relative p-4">
                                        {post.mediaType === "video" ? (
                                            <video
                                                src={url}
                                                controls
                                                className="max-w-full max-h-full rounded-md object-contain"
                                                autoPlay
                                                muted
                                            />
                                        ) : (
                                            <Image unoptimized width={800} height={600} 
                                                src={url}
                                                alt={`Post media ${i + 1}`}
                                                className="max-w-full max-h-[95%] object-contain drop-shadow-2xl"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Navigation Arrows */}
                            {post.mediaUrls && post.mediaUrls.length > 1 && (
                                <>
                                    {currentIndex > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "absolute left-4 top-1/2 -translate-y-1/2 text-white rounded-full h-10 w-10 md:opacity-0 md:group-hover/media:opacity-100 transition-opacity",
                                                    glass("mediaOverlay")
                                                )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                scrollToIndex(currentIndex - 1)
                                            }}
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                    )}
                                    {currentIndex < post.mediaUrls.length - 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "absolute right-4 top-1/2 -translate-y-1/2 text-white rounded-full h-10 w-10 md:opacity-0 md:group-hover/media:opacity-100 transition-opacity",
                                                    glass("mediaOverlay")
                                                )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                scrollToIndex(currentIndex + 1)
                                            }}
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    )}

                                    <div className={cn(
                                        "absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 text-white px-3 py-1 rounded-full text-xs font-medium z-10 pointer-events-none",
                                        glass("mediaCounter")
                                    )}>
                                        {currentIndex + 1} / {post.mediaUrls.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="flex flex-col flex-1 relative w-full md:w-[35%] lg:w-[30%] xl:w-[28%] min-h-0">
                            <div className="p-4 sm:p-6 pb-2 space-y-4 shrink-0">
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
                                    isOwner={false}
                                    hideOptions={true}
                                />

                                <PostContent
                                    content={post.content}
                                    hasLink={post.hasLink}
                                    linkUrl={post.linkUrl}
                                    hasMedia={false}
                                    truncateText={false}
                                />

                                <PostActions
                                    postId={post.id}
                                    myReaction={post.myReaction}
                                    onLike={(id) => onLike?.(id)}
                                    onReaction={(id, emoji) => onReaction?.(id, emoji)}
                                    onCommentClick={() => { }}
                                    onShareClick={() => onShare?.()}
                                />
                            </div>

                            <div className="h-px bg-border w-full shrink-0" />

                            <ScrollArea className="flex-1 w-full px-4 sm:px-6 pt-4 pb-4 min-h-0">
                                <div tabIndex={-1} autoFocus className="focus:outline-none w-full h-full">
                                    <h4 className="text-sm font-semibold mb-4 text-foreground/80">Comments</h4>
                                    <CommentSection />
                                </div>
                            </ScrollArea>
                        </div>
                    </GlassCard>
                ) : (
                    // ─── Single-Column Layout (Text/Link Posts) ───
                    <GlassCard className="w-full h-full" innerClassName="flex flex-col w-full h-full relative min-h-0">
                        <div className="p-4 sm:p-6 md:p-8 pb-0 space-y-6 shrink-0">
                            {/* Header */}
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
                                isOwner={false}
                                hideOptions={true}
                            />

                            {/* Main Content */}
                            <div className="ml-12 md:ml-14">
                                <PostContent
                                    content={post.content}
                                    hasLink={post.hasLink}
                                    linkUrl={post.linkUrl}
                                    hasMedia={false}
                                    truncateText={false}
                                />

                                <div className="mt-6">
                                    <PostActions
                                        postId={post.id}
                                        myReaction={post.myReaction}
                                        onLike={(id) => onLike?.(id)}
                                        onReaction={(id, emoji) => onReaction?.(id, emoji)}
                                        onCommentClick={() => { }}
                                        onShareClick={() => onShare?.()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-border/60 my-6 ml-12 md:ml-14 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-3.5rem)] shrink-0" />

                        {/* Comments Flowing Downwards */}
                        <ScrollArea className="flex-1 min-h-0 w-full px-4 sm:px-6 md:px-8 pb-4">
                            <div className="ml-12 md:ml-14 focus:outline-none" tabIndex={-1} autoFocus>
                                <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-foreground/80">
                                    Comments
                                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground font-medium">1.2k</span>
                                </h4>
                                <CommentSection />
                            </div>
                        </ScrollArea>
                    </GlassCard>
                )}
            </DialogContent>
        </Dialog>
    )
}
