"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, SendHorizontal } from "lucide-react"
import { useState } from "react"

export function ChatInput() {
    const [input, setInput] = useState("")

    return (
        <div className="relative border rounded-xl overflow-hidden bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary">
            <Textarea
                placeholder="Ask for advice, career tips, or connection strategies..."
                className="min-h-[3.5rem] max-h-32 resize-none border-0 focus-visible:ring-0 p-4 pr-12"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
            />
            <div className="absolute right-2 bottom-2">
                <Button
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={!input.trim()}
                >
                    <SendHorizontal className="h-4 w-4" />
                </Button>
            </div>
            <div className="absolute left-2 bottom-2 opacity-50 pointer-events-none">

            </div>
        </div>
    )
}
