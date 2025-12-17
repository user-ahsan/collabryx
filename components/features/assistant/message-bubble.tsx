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
            "flex gap-4 p-4 rounded-xl",
            isAssistant ? "bg-muted/50" : "bg-background"
        )}>
            <Avatar className="h-8 w-8 mt-1 border">
                {isAssistant ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                    </AvatarFallback>
                ) : (
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="font-semibold text-sm">
                    {isAssistant ? "Collabryx AI" : "You"}
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </div>
            </div>
        </div>
    )
}
