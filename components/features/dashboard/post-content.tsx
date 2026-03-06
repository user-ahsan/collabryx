"use client"

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
    return (
        <div className="md:pl-16">
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
                    <img
                        src={mediaUrl}
                        alt="Post media"
                        className="w-full h-auto object-cover max-h-[500px]"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-muted');
                            const errorText = document.createElement('div');
                            errorText.className = "text-muted-foreground text-sm flex flex-col items-center gap-2";
                            errorText.innerHTML = '<svg class="h-8 w-8 opacity-50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span>Media failed to load</span>';
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
    )
}
