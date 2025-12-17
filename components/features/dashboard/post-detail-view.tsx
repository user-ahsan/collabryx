"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Heart,
    MessageCircle,
    Share2,
    Globe,
    ArrowLeft,
    ThumbsUp
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { PostOptionsDropdown } from "./post-options-dropdown"
import { RichTextDisplay } from "./rich-text-display"
import { LinkPreview } from "./link-preview"
import { CommentSection } from "./comment-section"
import { ReactionPicker } from "./reaction-picker"
import { ShareDialog } from "./share-dialog"
import { MediaViewer } from "./media-viewer"

interface PostDetailViewProps {
    post: {
        id: number
        author: string
        role: string
        time: string
        content: string
        avatar: string
        initials: string
        hasMedia?: boolean
        mediaType?: 'image' | 'video'
        mediaUrl?: string
        hasLink?: boolean
        linkUrl?: string
        stats: {
            likes: number
            comments: number
            shares: number
        }
    }
}

export function PostDetailView({ post }: PostDetailViewProps) {
    const router = useRouter()
    const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false)

    return (
        <div className="max-w-2xl mx-auto w-full pb-20 md:pb-10">
            {/* Mobile Back Header */}
            <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b p-3 flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="font-semibold text-lg">Post</span>
            </div>

            {/* Desktop Back Button */}
            <div className="hidden md:block mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="hover:bg-transparent hover:text-primary pl-0 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                </Button>
            </div>

            <Card className="border-none shadow-none md:border md:shadow-sm overflow-visible bg-background md:rounded-2xl">
                <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3 md:gap-4">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-background cursor-pointer">
                                <AvatarImage src={post.avatar} />
                                <AvatarFallback>{post.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="font-bold text-base md:text-lg text-foreground hover:underline cursor-pointer">
                                    {post.author}
                                </h1>
                                <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 md:gap-2">
                                    <span className="font-medium">{post.role}</span>
                                    <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-muted-foreground/40" />
                                    <span>{post.time}</span>
                                    <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-muted-foreground/40" />
                                    <Globe className="h-3 w-3" />
                                </div>
                            </div>
                        </div>
                        <PostOptionsDropdown />
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <RichTextDisplay
                            content={post.content}
                            className="text-base md:text-xl leading-relaxed text-foreground whitespace-pre-wrap font-normal"
                        />

                        {post.hasLink && post.linkUrl && (
                            <LinkPreview
                                url={post.linkUrl}
                                title="Content Preview Title"
                                description="Description of the linked content goes here."
                            />
                        )}

                        {post.hasMedia && post.mediaUrl && (
                            <div
                                className="md:rounded-xl -mx-4 md:mx-0 overflow-hidden bg-black/5 cursor-pointer"
                                onClick={() => setMediaViewerOpen(true)}
                            >
                                <img
                                    src={post.mediaUrl}
                                    alt="Post media"
                                    className="w-full h-auto max-h-[600px] object-contain md:object-cover bg-muted"
                                />
                            </div>
                        )}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between py-3 mt-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-primary/10 p-1 rounded-full">
                                <ThumbsUp className="h-3 w-3 text-primary fill-primary" />
                            </div>
                            <span>{post.stats.likes}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="hover:underline cursor-pointer">{post.stats.comments} Comments</span>
                            <span className="hover:underline cursor-pointer">{post.stats.shares} Shares</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Action Bar */}
                    <div className="flex items-center justify-between py-1 my-1">
                        <div className="flex-1 relative group/reaction">
                            <Button
                                variant="ghost"
                                className="w-full rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all gap-2 h-10 md:h-11"
                                onMouseEnter={() => setReactionPickerOpen(true)}
                                onMouseLeave={() => setReactionPickerOpen(false)}
                            >
                                <Heart className="h-5 w-5" />
                                <span className="font-medium">Like</span>
                            </Button>
                            {reactionPickerOpen && (
                                <div
                                    className="absolute bottom-full left-0 mb-2"
                                    onMouseEnter={() => setReactionPickerOpen(true)}
                                    onMouseLeave={() => setReactionPickerOpen(false)}
                                >
                                    <ReactionPicker
                                        isOpen={true}
                                        onSelect={() => setReactionPickerOpen(false)}
                                    />
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            className="flex-1 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all gap-2 h-10 md:h-11"
                        >
                            <MessageCircle className="h-5 w-5" />
                            <span className="font-medium">Comment</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex-1 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all gap-2 h-10 md:h-11"
                            onClick={() => setShareDialogOpen(true)}
                        >
                            <Share2 className="h-5 w-5" />
                            <span className="font-medium">Share</span>
                        </Button>
                    </div>

                    <Separator className="mb-4" />

                    {/* Comments */}
                    <CommentSection />
                </div>
            </Card>

            <ShareDialog
                isOpen={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                postUrl={typeof window !== 'undefined' ? window.location.href : ''}
            />

            {post.hasMedia && post.mediaUrl && (
                <MediaViewer
                    isOpen={mediaViewerOpen}
                    onClose={() => setMediaViewerOpen(false)}
                    url={post.mediaUrl}
                    type={post.mediaType || 'image'}
                />
            )}
        </div>
    )
}
