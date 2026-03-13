"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export function MessageInput() {
    const [message, setMessage] = useState("")

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
                onChange={(e) => setMessage(e.target.value)}
                rows={1}
            />
            <Button 
                aria-label="Send message" 
                size="icon-lg" 
                className={cn("shrink-0 h-10 w-10", glass("buttonPrimary"))}
                disabled={!message.trim()}
            >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
        </div>
    )
}
