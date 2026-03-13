import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface GlassBubbleProps {
    children: React.ReactNode
    className?: string
    /** For comment bubbles: rounded-tl-none creates the speech bubble effect */
    variant?: "default" | "comment" | "chat"
    /** Optional click handler */
    onClick?: () => void
    /** Hover effect */
    hoverable?: boolean
}

/**
 * GlassBubble - Standardized glass bubble component for comments and chat
 * 
 * Features:
 * - Consistent glass effect across all comment/chat bubbles
 * - Speech bubble tail option (rounded-tl-none for comments)
 * - Hover effects for interactivity
 * - Accessible and keyboard-friendly
 * 
 * Usage:
 * <GlassBubble variant="comment">
 *   <p>Comment content</p>
 * </GlassBubble>
 */
export function GlassBubble({
    children,
    className,
    variant = "default",
    onClick,
    hoverable = false,
}: GlassBubbleProps) {
    const baseStyles = glass("bubble")
    
    const variantStyles = {
        default: "rounded-xl",
        comment: "rounded-2xl rounded-tl-none",
        chat: "rounded-2xl",
    }

    const hoverStyles = hoverable ? "hover:shadow-md transition-all duration-200" : ""
    const clickStyles = onClick ? "cursor-pointer" : ""

    return (
        <div
            onClick={onClick}
            className={cn(
                baseStyles,
                variantStyles[variant],
                hoverStyles,
                clickStyles,
                className
            )}
        >
            {children}
        </div>
    )
}

/**
 * GlassBubbleBadge - Small badge component for likes/reactions inside bubbles
 * 
 * Usage:
 * <GlassBubble>
 *   <p>Comment text</p>
 *   <GlassBubbleBadge>👍 4</GlassBubbleBadge>
 * </GlassBubble>
 */
interface GlassBubbleBadgeProps {
    children: React.ReactNode
    className?: string
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function GlassBubbleBadge({
    children,
    className,
    position = "bottom-right",
}: GlassBubbleBadgeProps) {
    const positionStyles = {
        "bottom-right": "-bottom-2.5 right-1",
        "bottom-left": "-bottom-2.5 left-1",
        "top-right": "-top-2.5 right-1",
        "top-left": "-top-2.5 left-1",
    }

    return (
        <div
            className={cn(
                "absolute",
                positionStyles[position],
                glass("bubbleAccent"),
                "rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10",
                className
            )}
        >
            {children}
        </div>
    )
}

/**
 * GlassReactionPicker - Reaction picker for comments/chat
 * 
 * Usage:
 * <GlassReactionPicker
 *   isOpen={true}
 *   onSelect={(reaction) => handleReaction(reaction)}
 * />
 */
interface GlassReactionPickerProps {
    isOpen: boolean
    onSelect: (reaction: string) => void
    className?: string
}

const DEFAULT_REACTIONS = ["👍", "❤️", "😂", "🔥", "🙌", "😍", "😭", "😮", "🎉", "💯"]

export function GlassReactionPicker({
    isOpen,
    onSelect,
    className,
}: GlassReactionPickerProps) {
    if (!isOpen) return null

    return (
        <div
            className={cn(
                glass("dropdown"),
                "rounded-full p-1 gap-1 flex items-center",
                "animate-in fade-in zoom-in-95 duration-200",
                className
            )}
        >
            {DEFAULT_REACTIONS.map((reaction) => (
                <button
                    key={reaction}
                    aria-label={`React with ${reaction}`}
                    className="h-8 w-8 flex items-center justify-center hover:bg-white/[0.08] rounded-full hover:scale-125 transition-transform text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect(reaction)
                    }}
                    type="button"
                >
                    {reaction}
                </button>
            ))}
        </div>
    )
}
