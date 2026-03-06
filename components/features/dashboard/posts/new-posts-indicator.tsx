"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewPostsIndicatorProps {
    count: number
    onClick: () => void
    visible: boolean
}

export function NewPostsIndicator({ count, onClick, visible }: NewPostsIndicatorProps) {
    if (!visible) return null

    return (
        <div className="sticky top-20 z-30 flex justify-center w-full pointer-events-none mb-4">
            <Button
                onClick={onClick}
                className={cn(
                    "pointer-events-auto rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all animate-in slide-in-from-top-4 fade-in duration-300 gap-2 pl-4 pr-5 h-9"
                )}
            >
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-semibold">{count} New Posts</span>
            </Button>
        </div>
    )
}
