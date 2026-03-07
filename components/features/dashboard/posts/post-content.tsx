"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import Image from "next/image"
import { RichTextDisplay } from "./rich-text-display"
import { cn } from "@/lib/utils"
import { LinkPreview } from "./link-preview"

interface PostContentProps {
    content: string
    hasLink?: boolean
    linkUrl?: string
    hasMedia?: boolean
    mediaUrls?: string[]
    mediaType?: 'image' | 'video'
    onMediaExpanded?: (index: number) => void
    onPostClick?: () => void
    truncateText?: boolean
}

export function PostContent({ content, hasLink, linkUrl, hasMedia, mediaUrls, onMediaExpanded, onPostClick, truncateText }: PostContentProps) {
    const [mediaError, setMediaError] = useState<Record<number, boolean>>({})

    return (
        <div
            onClick={() => onPostClick && onPostClick()}
            className={cn(onPostClick && "cursor-pointer")}
        >
            <RichTextDisplay
                content={content}
                className="text-sm md:text-[15px] lg:text-base leading-relaxed text-foreground/90 font-normal"
                truncate={truncateText}
                maxWords={50}
            />

            {hasLink && linkUrl && (
                <LinkPreview
                    url={linkUrl}
                    title="The Future of Remote Work: What You Need to Know"
                    description="Explore the latest trends in distributed teams and asynchronous collaboration."
                    siteName="techdaily.com"
                />
            )}

            {hasMedia && mediaUrls && mediaUrls.length > 0 && (
                <div
                    className="mt-4 rounded-xl overflow-x-auto flex snap-x snap-mandatory shadow-sm border border-white/10 bg-black/5"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {mediaUrls.map((url, index) => (
                        <div
                            key={url}
                            className="min-w-full snap-center shrink-0 cursor-pointer relative group/image min-h-[200px]"
                            onClick={() => onMediaExpanded?.(index)}
                        >
                            {mediaError[index] ? (
                                <div className="flex items-center justify-center bg-muted min-h-[200px] h-full">
                                    <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <ImageOff className="h-8 w-8 opacity-50" />
                                        <span>Media failed to load</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-full aspect-video max-h-[500px]">
                                        <Image
                                            src={url}
                                            alt={`Post media ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            onError={() => setMediaError(prev => ({ ...prev, [index]: true }))}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm">
                                            Click to expand
                                        </div>
                                    </div>
                                    {mediaUrls.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-medium pointer-events-none">
                                            {index + 1} / {mediaUrls.length}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

