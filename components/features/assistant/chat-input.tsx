"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export function ChatInput() {
    const [input, setInput] = useState("")

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
                rows={1}
            />
            <div className="absolute right-2 bottom-2">
                <Button
                    size="icon"
                    className={cn("h-8 w-8 md:h-8 md:w-8 rounded-lg", glass("buttonPrimary"))}
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
