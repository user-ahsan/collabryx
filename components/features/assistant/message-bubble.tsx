"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isAssistant = message.role === "assistant"

    return (
        <div className={cn(
            "flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl",
            isAssistant ? "bg-muted/50" : "bg-background"
        )}>
            <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-0.5 md:mt-1 border shrink-0">
                {isAssistant ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </AvatarFallback>
                ) : (
                    <AvatarFallback>
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                <div className="font-semibold text-xs md:text-sm">
                    {isAssistant ? "Collabryx AI" : "You"}
                </div>
                <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                </div>
            </div>
        </div>
    )
}
