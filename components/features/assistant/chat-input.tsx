"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { toast } from "sonner"
import { sendMessage } from "@/lib/actions/ai-mentor"

interface ChatInputProps {
  sessionId: string | null
  onMessageSent: () => void
}

export function ChatInput({ sessionId, onMessageSent }: ChatInputProps) {
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)

    const handleSubmit = async () => {
        if (!input.trim() || !sessionId) return
        
        setIsSending(true)
        
        try {
            const result = await sendMessage(sessionId, input.trim())
            
            if (result.error) {
                toast.error(result.error.message || "Failed to send message")
                return
            }
            
            setInput("")
            onMessageSent()
            toast.success("Message sent")
        } catch {
            console.error("Error sending message:", error)
            toast.error("Failed to send message. Please try again.")
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className={cn(
            "relative rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all",
            glass("input"),
            "border"
        )}>
            <Textarea
                placeholder="Ask for advice, career tips, or connection strategies..."
                className={cn(
                    "min-h-[3.5rem] md:min-h-[3.5rem] max-h-32 resize-none border-0 focus-visible:ring-0 p-3 md:p-4 pr-11 md:pr-12 text-sm",
                    "bg-transparent"
                )}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isSending || !sessionId}
            />
            <div className="absolute right-2 bottom-2">
                <Button
                    size="icon"
                    className={cn("h-8 w-8 md:h-8 md:w-8 rounded-lg", glass("buttonPrimary"))}
                    disabled={!input.trim() || isSending || !sessionId}
                    onClick={handleSubmit}
                >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SendHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
}
