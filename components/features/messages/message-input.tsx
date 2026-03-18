"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { useMessages } from "@/hooks/use-messages"
import { toast } from "sonner"

interface MessageInputProps {
    conversationId: string
    onTyping?: () => void
    onStopTyping?: () => void
}

export function MessageInput({ conversationId, onTyping, onStopTyping }: MessageInputProps) {
    const [message, setMessage] = useState("")
    const { sendMessage } = useMessages()

    const handleTyping = useCallback(() => {
        onTyping?.()
    }, [onTyping])

    const handleStopTyping = useCallback(() => {
        onStopTyping?.()
    }, [onStopTyping])

    const handleSendMessage = async () => {
        if (!message.trim() || !conversationId) return
        
        const success = await sendMessage(conversationId, message)
        if (success) {
            setMessage("")
            handleStopTyping()
            toast.success("Message sent")
        } else {
            toast.error("Failed to send message")
        }
    }

    // Clear typing indicator when message is sent or input is cleared
    useEffect(() => {
        if (!message.trim()) {
            handleStopTyping()
        }
    }, [message, handleStopTyping])

    return (
        <div className={cn(
            "p-2 md:p-4 flex gap-2 md:gap-4 items-end",
            glass("header"),
            "border-t"
        )}>
            <Button 
                aria-label="Attach file" 
                variant="ghost" 
                size="icon-lg" 
                className={cn("shrink-0 h-10 w-10", glass("buttonGhost"))}
            >
                <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Textarea
                placeholder="Type a message..."
                className={cn(
                    "min-h-[2.5rem] max-h-32 resize-none text-sm md:text-base",
                    glass("input")
                )}
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value)
                    if (e.target.value.trim()) {
                        handleTyping()
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                    }
                }}
                rows={1}
            />
            <Button 
                aria-label="Send message" 
                size="icon-lg" 
                className={cn("shrink-0 h-10 w-10", glass("buttonPrimary"))}
                disabled={!message.trim()}
                onClick={handleSendMessage}
            >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
        </div>
    )
}
