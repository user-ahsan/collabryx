import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
    isTyping: boolean
    className?: string
}

export function TypingIndicator({ isTyping, className }: TypingIndicatorProps) {
    if (!isTyping) return null

    return (
        <div
            className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-none bg-background/40 backdrop-blur-md border border-border/40 w-fit",
                className
            )}
        >
            <div className="flex gap-1">
                <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                />
                <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                />
                <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                />
            </div>
        </div>
    )
}
