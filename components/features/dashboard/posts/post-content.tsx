"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import Image from "next/image"
import { RichTextDisplay } from "./rich-text-display"
import { LinkPreview } from "./link-preview"

interface PostContentProps {
    content: string
    hasLink?: boolean
    linkUrl?: string
    hasMedia?: boolean
    mediaUrl?: string
    mediaType?: 'image' | 'video'
    onMediaExpanded?: () => void
}

export function PostContent({ content, hasLink, linkUrl, hasMedia, mediaUrl, onMediaExpanded }: PostContentProps) {
    const [mediaError, setMediaError] = useState(false)

    return (
        <div>
            <RichTextDisplay content={content} className="text-sm md:text-[15px] lg:text-base leading-relaxed text-foreground/90 font-normal" />

            {hasLink && linkUrl && (
                <LinkPreview
                    url={linkUrl}
                    title="The Future of Remote Work: What You Need to Know"
                    description="Explore the latest trends in distributed teams and asynchronous collaboration."
                    siteName="techdaily.com"
                />
            )}

            {hasMedia && mediaUrl && (
                <div
                    className="mt-4 rounded-xl overflow-hidden shadow-sm border border-white/10 bg-black/5 cursor-pointer relative group/image min-h-[200px]"
                    onClick={onMediaExpanded}
                >
                    {mediaError ? (
                        <div className="flex items-center justify-center bg-muted min-h-[200px]">
                            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <ImageOff className="h-8 w-8 opacity-50" />
                                <span>Media failed to load</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-full aspect-video max-h-[500px]">
                                <Image
                                    src={mediaUrl}
                                    alt="Post media"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onError={() => setMediaError(true)}
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm">
                                    Click to expand
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

