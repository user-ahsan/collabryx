"use client"

import { ThumbsUp, Heart, Smile, Flame, Frown, Angry } from "lucide-react"

const REACTIONS = [
    { id: "like", label: "Like", icon: ThumbsUp, color: "text-blue-500" },
    { id: "love", label: "Love", icon: Heart, color: "text-red-500" },
    { id: "haha", label: "Haha", icon: Smile, color: "text-yellow-500" },
    { id: "wow", label: "Wow", icon: Flame, color: "text-orange-500" },
    { id: "sad", label: "Sad", icon: Frown, color: "text-blue-400" },
    { id: "angry", label: "Angry", icon: Angry, color: "text-red-600" },
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
                    key={r.id}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect(r.id)
                    }}
                    aria-label={`React with ${r.label}`}
                    className="h-9 w-9 flex items-center justify-center text-2xl hover:scale-125 transition-transform hover:bg-muted/50 rounded-full relative group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    title={r.label}
                >
                    <r.icon className={`h-5 w-5 ${r.color}`} />
                </button>
            ))}
        </div>
    )
}
