/**
 * ============================================================================
 * MessageBubble — Theme-Aware, Conversation-Style Chat Message Component
 * ============================================================================
 *
 * PROBLEM (from user feedback):
 * The original chat bubbles had three issues:
 *  1. "Ugly pure white background" — Assistant messages used glass('bubble')
 *     which rendered as a washed-out white in light mode with no clear visual
 *     distinction between user and assistant messages. Both bubble types used
 *     the same `bg-background/40` base, making the conversation hard to scan.
 *  2. "Too large" — Both bubbles used `p-3 md:p-4` (12-16px padding on ALL
 *     sides), creating massive white rectangles that dominated the viewport.
 *     Combined with `rounded-xl shadow-sm`, each bubble had unnecessary visual
 *     weight that made the chat feel bloated.
 *  3. No conversation-style layout — Both bubbles were identical in alignment
 *     (centered, same width), lacking the alternating left-right pattern that
 *     makes chat interfaces scannable. Users couldn't instantly tell who said
 *     what by position alone.
 *
 * SOLUTION:
 * Complete restyling following modern chat UI conventions:
 *  - **Alternating alignment**: Assistant bubbles align left with `self-start`,
 *    user bubbles align right with `self-end flex-row-reverse`. The avatar
 *    appears on the opposite side too for clear visual separation.
 *  - **Constrained width**: `max-w-[88%] md:max-w-[78%]` prevents bubbles from
 *    stretching full-width. Short messages look compact, long ones wrap naturally.
 *  - **Theme-aware backgrounds**: Assistant uses `bg-card/90 border-border/40`
 *    (adapts to dark/light theme via CSS variable), user uses
 *    `bg-primary/10 border-primary/20` (subtle tint that's visible in both modes).
 *  - **Reduced padding**: `px-3.5 py-2 md:px-4 md:py-2.5` — tighter horizontal
 *    padding, vertically compact. Messages look denser without feeling cramped.
 *  - **Chat-style corners**: `rounded-2xl` with asymmetric bottom corner
 *    (`rounded-bl-md` for assistant, `rounded-br-md` for user) creates the
 *    classic "speech bubble" tail effect.
 *  - **Removed shadow**: `shadow-sm` was dropped for a cleaner, flatter look
 *    that's more modern and less visually heavy.
 *  - **Smaller avatars**: Reduced from `h-8 w-8` to `h-6 w-6 md:h-7 md:w-7`,
 *    sized relative to the bubble rather than dominating the gutter.
 *  - **Pulsing cursor during streaming**: Replaced with a smaller,
 *    `align-text-bottom` cursor that fits inline with text.
 *
 * @see {@link ../ai-mentor/ai-structured-response.tsx} — renders idea cards below bubbles
 * ============================================================================
 */
'use client'

import { useMemo } from 'react'
import { Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { AIStructuredResponse, StartupIdeaAction } from '@/types/ai-responses'
import { isAIStructuredResponse } from '@/types/ai-responses'
import { AIStructuredResponse as StructuredResponseRenderer } from '@/components/features/ai-mentor/ai-structured-response'

interface Message {
  role: 'user' | 'assistant'
  content: string
  structured?: AIStructuredResponse
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  onSuggestionClick?: (suggestion: string) => void
  onIdeaAction?: (ideaId: number, action: StartupIdeaAction) => void
}

export function MessageBubble({ message, isStreaming, onSuggestionClick, onIdeaAction }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  const structuredData = useMemo<AIStructuredResponse | null>(() => {
    if (message.structured) return message.structured
    if (!isAssistant) return null
    try {
      const parsed = JSON.parse(message.content)
      return isAIStructuredResponse(parsed) ? parsed : null
    } catch {
      return null
    }
  }, [message.content, message.structured, isAssistant])

  const displayContent = structuredData ? structuredData.message : message.content

  return (
    <div className={cn(
      'flex gap-2 md:gap-2.5 max-w-[88%] md:max-w-[78%] transition-colors',
      isAssistant ? 'self-start' : 'self-end flex-row-reverse',
    )}>
      {/* Avatar */}
      <Avatar className={cn(
        'h-6 w-6 md:h-7 md:w-7 mt-1 shrink-0 border',
        isAssistant ? '' : 'border-primary/30',
      )}>
        {isAssistant ? (
          <AvatarFallback className='bg-primary/10 text-primary text-[10px]'>
            <Bot className='h-3 w-3 md:h-3.5 md:w-3.5' />
          </AvatarFallback>
        ) : (
          <AvatarFallback className='bg-primary/20 text-primary text-[10px]'>
            <User className='h-3 w-3 md:h-3.5 md:w-3.5' />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Bubble */}
      <div className='flex-1 min-w-0 space-y-1'>
        <div className={cn(
          'rounded-2xl px-3.5 py-2 md:px-4 md:py-2.5 text-sm leading-relaxed',
          isAssistant
            ? 'bg-card/90 border border-border/40 text-card-foreground shadow-sm rounded-bl-md'
            : 'bg-primary/10 border border-primary/20 text-foreground rounded-br-md',
        )}>
          <div className='whitespace-pre-wrap break-words'>
            {displayContent}
            {isStreaming && (
              <span className='inline-block ml-0.5 w-1.5 h-3.5 bg-foreground/60 animate-pulse rounded-sm align-text-bottom' />
            )}
          </div>
        </div>

        {/* Structured data (idea cards, suggestions) rendered below assistant bubbles */}
        {isAssistant && structuredData && (
          <StructuredResponseRenderer
            data={structuredData}
            onSuggestionClick={onSuggestionClick}
            onIdeaAction={onIdeaAction}
          />
        )}
      </div>
    </div>
  )
}
