import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Sanitize content for safe usage in URLs and text
const sanitizeContent = (content: string): string => {
    // Remove any potentially dangerous characters while preserving alphanumeric, underscores, and hyphens
    return content.replace(/[^a-zA-Z0-9_-]/g, '')
}

// Validate that content is safe for URL usage
const isValidUrlContent = (content: string): boolean => {
    // Check if content only contains safe characters
    return /^[a-zA-Z0-9_-]+$/.test(content)
}

interface RichTextDisplayProps {
    content: string
    className?: string
    truncate?: boolean
    maxWords?: number
}

export function RichTextDisplay({ content, className, truncate = false, maxWords = 50 }: RichTextDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(!truncate)

    // Validate and sanitize the content to prevent XSS
    if (!content || typeof content !== 'string') {
        return null
    }
    
    // Sanitize the content to prevent XSS
    const sanitizedContent = sanitizeContent(content)
    const words = sanitizedContent.split(/\s+/)
    const needsTruncation = truncate && words.length > maxWords
    const isTruncated = needsTruncation && !isExpanded

    const displayContent = isTruncated ? words.slice(0, maxWords).join(" ") + "..." : sanitizedContent

    // Regex to find @mentions and #hashtags
    // Captures: 1. generic text, 2. @mention, 3. #hashtag
    const parts = displayContent.split(/(@\w+|#\w+)/g)

    return (
        <div className={cn("relative", className)}>
            <p className="whitespace-pre-wrap break-words">
                {parts.map((part, index) => {
                    if (part.startsWith('@')) {
                        const username = part.slice(1)
                        // Validate and sanitize the username before using in href
                        const safeUsername = isValidUrlContent(username) ? username : sanitizeContent(username)
                        return (
                            <Link
                                key={index}
                                href={`/profile/${safeUsername}`}
                                className="text-primary font-medium hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {part}
                            </Link>
                        )
                    }
                    if (part.startsWith('#')) {
                        const topic = part.slice(1)
                        // Validate and sanitize the topic before using in href
                        const safeTopic = isValidUrlContent(topic) ? topic : sanitizeContent(topic)
                        return (
                            <Link
                                key={index}
                                href={`/topic/${safeTopic}`}
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
