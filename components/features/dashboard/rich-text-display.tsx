import Link from "next/link"

interface RichTextDisplayProps {
    content: string
    className?: string
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
    // Regex to find @mentions and #hashtags
    // Captures: 1. generic text, 2. @mention, 3. #hashtag
    const parts = content.split(/(@\w+|#\w+)/g)

    return (
        <p className={className}>
            {parts.map((part, index) => {
                if (part.startsWith('@')) {
                    return (
                        <Link
                            key={index}
                            href={`/profile/${part.slice(1)}`}
                            className="text-primary font-medium hover:underline"
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
                        >
                            {part}
                        </Link>
                    )
                }
                return <span key={index}>{part}</span>
            })}
        </p>
    )
}
