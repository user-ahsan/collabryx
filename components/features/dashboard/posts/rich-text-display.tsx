import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface RichTextDisplayProps {
    content: string
    className?: string
    truncate?: boolean
    maxWords?: number
}

export function RichTextDisplay({ content, className, truncate = false, maxWords = 50 }: RichTextDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(!truncate)

    const words = content.split(/\s+/)
    const needsTruncation = truncate && words.length > maxWords
    const isTruncated = needsTruncation && !isExpanded

    const displayContent = isTruncated ? words.slice(0, maxWords).join(" ") + "..." : content

    // Regex to find @mentions and #hashtags
    // Captures: 1. generic text, 2. @mention, 3. #hashtag
    const parts = displayContent.split(/(@\w+|#\w+)/g)

    return (
        <div className={cn("relative", className)}>
            <p className="whitespace-pre-wrap break-words">
                {parts.map((part, index) => {
                    if (part.startsWith('@')) {
                        return (
                            <Link
                                key={index}
                                href={`/profile/${part.slice(1)}`}
                                className="text-primary font-medium hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {part}
                            </Link>
                        )
                    }
                    if (part.startsWith('#')) {
                        return (
                            <Link
                                key={index}
                                href={`/topic/${part.slice(1)}`}
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {part}
                            </Link>
                        )
                    }
                    return <span key={index}>{part}</span>
                })}
                {isTruncated && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsExpanded(true)
                        }}
                        className="text-muted-foreground hover:text-foreground font-semibold ml-2 transition-colors cursor-pointer"
                    >
                        Read more
                    </button>
                )}
            </p>
        </div>
    )
}
