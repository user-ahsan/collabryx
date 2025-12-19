"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useState } from "react"

export function MessageInput() {
    const [message, setMessage] = useState("")

    return (
        <div className="p-2 md:p-4 border-t flex gap-2 md:gap-4 items-end bg-background">
            <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10">
                <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Textarea
                placeholder="Type a message..."
                className="min-h-[2.5rem] max-h-32 resize-none text-sm md:text-base"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={1}
            />
            <Button size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10" disabled={!message.trim()}>
                <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
        </div>
    )
}
