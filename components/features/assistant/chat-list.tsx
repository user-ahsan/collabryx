"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { Loader2 } from "lucide-react"
import { getSessionHistory } from "@/lib/actions/ai-mentor"
import type { AIMessage } from "@/lib/actions/ai-mentor"

interface ChatListProps {
    sessionId: string | null
}

export function ChatList({ sessionId }: ChatListProps) {
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!sessionId) {
            setMessages([])
            return
        }

        const loadMessages = async () => {
            setIsLoading(true)
            try {
                const result = await getSessionHistory(sessionId)
                
                if (result.error) {
                    console.error("Failed to load messages:", result.error)
                    return
                }
                
                setMessages(result.data || [])
            } catch {
                console.error("Error loading messages:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadMessages()
    }, [sessionId])

    if (!sessionId) {
        return (
            <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Start a conversation with AI Mentor
                </div>
            </ScrollArea>
        )
    }

    if (isLoading) {
        return (
            <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ScrollArea>
        )
    }

    return (
        <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4 max-w-3xl mx-auto w-full">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        Start the conversation! Ask for career advice or collaboration tips.
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={{
                                role: msg.role as 'user' | 'assistant',
                                content: msg.content,
                            }}
                        />
                    ))
                )}
            </div>
        </ScrollArea>
    )
}
