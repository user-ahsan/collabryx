'use client'

import { useMemo } from 'react'
import { Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
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
      'flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl shadow-sm transition-all',
      isAssistant
        ? glass('bubble') + ' border border-border/40'
        : glass('buttonPrimary') + ' text-primary-foreground',
    )}>
      <Avatar className='h-7 w-7 md:h-8 md:w-8 mt-0.5 md:mt-1 border shrink-0'>
        {isAssistant ? (
          <AvatarFallback className='bg-primary text-primary-foreground'>
            <Bot className='h-3.5 w-3.5 md:h-4 md:w-4' />
          </AvatarFallback>
        ) : (
          <AvatarFallback>
            <User className='h-3.5 w-3.5 md:h-4 md:w-4' />
          </AvatarFallback>
        )}
      </Avatar>
      <div className='flex-1 space-y-1.5 md:space-y-2 min-w-0'>
        <div className='font-semibold text-xs md:text-sm'>
          {isAssistant ? 'Collabryx AI' : 'You'}
        </div>
        <div className='text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {displayContent}
          {isStreaming && (
            <span className='inline-block ml-0.5 w-1.5 h-4 bg-foreground/70 animate-pulse rounded-sm' />
          )}
        </div>
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
