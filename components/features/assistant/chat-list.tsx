'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/conversation'
import { MessageBubble } from '@/components/features/assistant/message-bubble'
import type { AIStructuredResponse, StartupIdeaAction } from '@/types/ai-responses'
import { getSessionHistory } from '@/lib/actions/ai-mentor'
import type { AIMessage } from '@/lib/actions/ai-mentor'
interface ChatListProps {
  sessionId: string | null
  externalMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
    structured?: AIStructuredResponse
  }>
  isLoadingExternal?: boolean
  onSuggestionClick?: (suggestion: string) => void
  onIdeaAction?: (ideaId: number, action: StartupIdeaAction) => void
  onRefresh?: () => void
}

export function ChatList({
  sessionId,
  externalMessages = [],
  isLoadingExternal = false,
  onSuggestionClick,
  onIdeaAction,
  onRefresh,
}: ChatListProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Determine if the last external message is currently streaming
  const lastExtIndex = externalMessages.length - 1
  const isStreamingLast = isLoadingExternal && lastExtIndex >= 0 && externalMessages[lastExtIndex].role === 'assistant'
  useEffect(() => {
    if (!sessionId) { setMessages([]); return }
    const load = async () => {
      setIsLoading(true)
      try {
        const r = await getSessionHistory(sessionId)
        if (!r.error) { setMessages(r.data || []); onRefresh?.() }
      } catch {} finally { setIsLoading(false) }
    }
    load()
  }, [sessionId, onRefresh])

  const combinedMessages = useMemo(() => {
    const loaded = messages.map((m) => ({
      key: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      structured: undefined as AIStructuredResponse | undefined,
    }))
    const ext = externalMessages.map((m, i) => {
      const isStreaming = isStreamingLast && i === lastExtIndex
      return { key: `ext-${i}`, ...m, isStreaming }
    })
    return [...loaded, ...ext]
  }, [messages, externalMessages, isStreamingLast, lastExtIndex])

  return (
    <div className='relative flex-1'>
      <Conversation className='flex-1'>
        <ConversationContent>
          {!sessionId ? (
            <div className='flex items-center justify-center h-full text-muted-foreground'>
              Start a conversation with AI Mentor
            </div>
          ) : isLoading ? (
            <div className='flex items-center justify-center h-full'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : combinedMessages.length === 0 ? (
            <div className='flex items-center justify-center h-full'>
              {isLoadingExternal ? (
                <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='text-sm'>Generating startup ideas...</span>
                </div>
              ) : (
                <div className='text-center text-muted-foreground py-8'>
                  Ask for startup ideas or career advice to get started!
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-3 md:gap-4 max-w-3xl mx-auto w-full'>
              {combinedMessages.map((msg) => (
                <MessageBubble
                  key={msg.key}
                  message={{ role: msg.role, content: msg.content, structured: msg.structured }}
                  isStreaming={msg.isStreaming}
                  onSuggestionClick={onSuggestionClick}
                  onIdeaAction={onIdeaAction}
                />
              ))}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}
ChatList.displayName = 'ChatList'
