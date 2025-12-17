"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"

const MESSAGES = [
    {
        role: "assistant" as const,
        content: "Hello! I'm your AI career mentor. I can help you find relevant connections, improve your profile, or suggest project ideas. How can I help you today?",
    },
]

export function ChatList() {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
                {MESSAGES.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))}
            </div>
        </ScrollArea>
    )
}
