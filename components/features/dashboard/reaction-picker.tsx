"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const REACTIONS = [
    { emoji: "👍", label: "Like" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Haha" },
    { emoji: "😮", label: "Wow" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
]

interface ReactionPickerProps {
    onSelect: (reaction: string) => void
    isOpen: boolean
}

export function ReactionPicker({ onSelect, isOpen }: ReactionPickerProps) {
    if (!isOpen) return null

    return (
        <div className="absolute -top-12 left-0 bg-background border shadow-xl rounded-full p-1.5 flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
            {REACTIONS.map((r) => (
                <button
                    key={r.label}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect(r.emoji)
                    }}
                    className="h-9 w-9 flex items-center justify-center text-2xl hover:scale-125 transition-transform hover:bg-muted/50 rounded-full relative group"
                    title={r.label}
                >
                    {r.emoji}
                </button>
            ))}
        </div>
    )
}
