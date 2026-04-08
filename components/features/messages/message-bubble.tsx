"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface MessageBubbleProps {
    id: string
    text: string
    senderId: string
    currentUserId: string
    isRead: boolean
    readAt?: string | null
    createdAt: string
    attachmentUrl?: string
    attachmentType?: "image" | "file"
    className?: string
}

export function MessageBubble({
    text,
    senderId,
    currentUserId,
    isRead,
    readAt,
    createdAt,
    attachmentUrl,
    attachmentType,
    className
}: MessageBubbleProps) {
    const isMe = senderId === currentUserId
    const time = new Date(createdAt).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
    })

    const _fullTime = new Date(createdAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    })

    return (
        <div
            className={cn(
                "flex w-full flex-col",
                isMe ? "items-end" : "items-start",
                className
            )}
        >
            <div
                className={cn(
                    "rounded-2xl p-2.5 md:p-3 text-sm max-w-[95%] md:max-w-[80%] shadow-sm transition-all relative",
                    isMe
                        ? "bg-primary/90 backdrop-blur-md text-primary-foreground rounded-br-none shadow-[0_4px_32px_0_rgba(59,130,246,0.06)]"
                        : "bg-background/40 backdrop-blur-md rounded-bl-none border border-border/40"
                )}
            >
                {/* Attachment */}
                {attachmentUrl && attachmentType === "image" && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                        {/* eslint-disable @next/next/no-img-element */}
                        <img
                            src={attachmentUrl}
                            alt="Attachment"
                            className="w-full h-auto max-w-xs object-cover"
                        />
                    </div>
                )}

                {attachmentUrl && attachmentType === "file" && (
                    <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "block mb-2 px-3 py-2 rounded-lg text-xs truncate",
                            isMe
                                ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        📎 View Attachment
                    </a>
                )}

                {/* Message Text */}
                <div>{text}</div>

                {/* Timestamp and Read Receipt */}
                <div className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    isMe ? "justify-end" : "justify-start"
                )}>
                    <span className={cn(
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                        {time}
                    </span>
                    
                    {/* Read Receipt - only show for sender's messages */}
                    {isMe && (
                        <div className="relative group">
                            <div className={cn(
                                "flex items-center gap-0.5",
                                isRead ? "text-blue-400" : "text-primary-foreground/50"
                            )}>
                                <Check className="h-3 w-3" />
                                {isRead && <Check className="h-3 w-3 -ml-1.5" />}
                            </div>
                            
                            {/* Tooltip with read timestamp */}
                            {isRead && readAt && (
                                <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    Read {new Date(readAt).toLocaleString([], {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
