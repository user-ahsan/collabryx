import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface GlassMessageBubbleProps {
    children: React.ReactNode
    className?: string
    /** "sent" for current user, "received" for others */
    variant: "sent" | "received"
    /** Show sender name (for received messages in group chats) */
    showSender?: boolean
    senderName?: string
    timestamp?: string
    /** Avatar for received messages */
    avatar?: React.ReactNode
}

/**
 * GlassMessageBubble - Standardized glass message bubble for chat/messaging
 * 
 * Features:
 * - Consistent glass effect for all message bubbles
 * - Sent/Received variants with appropriate styling
 * - Optional sender info and timestamp
 * - Accessible and keyboard-friendly
 * 
 * Usage:
 * <GlassMessageBubble variant="sent">
 *   <p>Message content</p>
 * </GlassMessageBubble>
 */
export function GlassMessageBubble({
    children,
    className,
    variant,
    showSender = false,
    senderName,
    timestamp,
    avatar,
}: GlassMessageBubbleProps) {
    const isSent = variant === "sent"

    return (
        <div
            className={cn(
                "flex gap-3 max-w-[95%] md:max-w-[80%]",
                isSent ? "self-end flex-row-reverse" : "self-start"
            )}
        >
            {/* Avatar for received messages */}
            {!isSent && avatar && (
                <div className="shrink-0 mt-auto">{avatar}</div>
            )}

            <div
                className={cn(
                    "rounded-2xl p-3 text-sm shadow-sm transition-all",
                    isSent
                        ? glass("buttonPrimary") + " rounded-br-none text-primary-foreground"
                        : glass("bubble") + " rounded-bl-none",
                    className
                )}
            >
                {/* Sender name for group chats */}
                {showSender && senderName && (
                    <p className={cn(
                        "text-xs font-semibold mb-1",
                        isSent ? "text-primary-foreground/80" : "text-foreground"
                    )}>
                        {senderName}
                    </p>
                )}

                {/* Message content */}
                <div className={cn(
                    "leading-relaxed whitespace-pre-wrap break-words",
                    isSent ? "text-primary-foreground/90" : "text-foreground"
                )}>
                    {children}
                </div>

                {/* Timestamp */}
                {timestamp && (
                    <p className={cn(
                        "text-[10px] mt-1",
                        isSent ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                        {timestamp}
                    </p>
                )}
            </div>
        </div>
    )
}

/**
 * GlassChatInput - Standardized glass chat input component
 * 
 * Features:
 * - Consistent glass effect for chat input area
 * - Attachment button support
 * - Send button with disabled state
 * - Auto-resize textarea
 * 
 * Usage:
 * <GlassChatInput
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 *   placeholder="Type a message..."
 * />
 */
interface GlassChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    placeholder?: string
    disabled?: boolean
    className?: string
    /** Show attachment button */
    showAttachment?: boolean
    onAttachmentClick?: () => void
}

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Paperclip } from "lucide-react"

export function GlassChatInput({
    value,
    onChange,
    onSend,
    placeholder = "Type a message...",
    disabled = false,
    className,
    showAttachment = true,
    onAttachmentClick,
}: GlassChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() && !disabled) {
                onSend()
            }
        }
    }

    return (
        <div
            className={cn(
                "p-3 md:p-4",
                glass("header"),
                className
            )}
        >
            <div className="flex gap-2 md:gap-3 items-end">
                {/* Attachment button */}
                {showAttachment && (
                    <Button
                        aria-label="Attach file"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "shrink-0 h-10 w-10",
                            glass("buttonGhost")
                        )}
                        onClick={onAttachmentClick}
                        type="button"
                    >
                        <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                )}

                {/* Text input */}
                <Textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                        "min-h-[2.5rem] max-h-32 resize-none text-sm md:text-base",
                        glass("input")
                    )}
                    rows={1}
                />

                {/* Send button */}
                <Button
                    aria-label="Send message"
                    size="icon"
                    className={cn(
                        "shrink-0 h-10 w-10",
                        glass("buttonPrimary")
                    )}
                    disabled={!value.trim() || disabled}
                    onClick={onSend}
                    type="submit"
                >
                    <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
            </div>
        </div>
    )
}
