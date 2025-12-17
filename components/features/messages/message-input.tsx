"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useState } from "react"

export function MessageInput() {
    const [message, setMessage] = useState("")

    return (
        <div className="p-4 border-t flex gap-4 items-end bg-background">
            <Button variant="outline" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
                placeholder="Type a message..."
                className="min-h-[2.5rem] max-h-32 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={1}
            />
            <Button size="icon" className="shrink-0" disabled={!message.trim()}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
    )
}
