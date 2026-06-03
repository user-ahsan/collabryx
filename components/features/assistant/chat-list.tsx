/**
 * ============================================================================
 * ChatList — Message History Viewer with Streaming Deduplication
 * ============================================================================
 *
 * PROBLEM (Bug #2 & #3 from analysis):
 * The original ChatList called getSessionHistory() with a client-random UUID
 * that never existed in the database, so it always returned empty. Meanwhile,
 * the useAIStream hook populated externalMessages with streaming responses
 * that were displayed but never persisted. The two sources (DB history and
 * streaming messages) were concatenated without deduplication, so if the DB
 * happened to have messages, they'd appear twice.
 *
 * SOLUTION:
 * This component now properly merges TWO message sources:
 *
 *  1. DB History (messages state):
 *     - Loaded via getSessionHistory(sessionId) whenever sessionId changes
 *     - sessionId is now a REAL DB UUID (synced from the streaming API route)
 *     - Loading state with spinner, empty state when no messages exist
 *
 *  2. Streaming Messages (externalMessages prop):
 *     - Passed from AIMentorContent's useAIStream hook
 *     - Contains the latest user + assistant messages being streamed
 *     - The last assistant message gets the isStreaming flag for cursor
 *
 *  3. Deduplication via content-set:
 *     - Before merging, the component builds a Set of all content strings
 *       from DB messages
 *     - Streaming messages whose content already exists in DB are filtered
 *       out (they were persisted by the stream route on completion)
 *     - This prevents double-display when the stream completes and the next
 *       auto-refresh loads the persisted message from DB
 *
 * The gap/spacing was also reduced from `gap-3 md:gap-4` to `gap-2 md:gap-3`
 * to make the chat feel tighter and more responsive.
 *
 * @see {@link ../../lib/actions/ai-mentor.ts} — getSessionHistory server action
 * @see {@link ../ai-mentor/ai-mentor-content.tsx} — provides externalMessages
 * ============================================================================
 */
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

  // Load history from DB when session ID is available
  useEffect(() => {
    if (!sessionId) { setMessages([]); return }
    const load = async () => {
      setIsLoading(true)
      try {
        const r = await getSessionHistory(sessionId)
        if (!r.error) { setMessages(r.data || []); onRefresh?.() }
      } catch { /* silently fail */ } finally { setIsLoading(false) }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Memoize: merge DB history with streaming messages, deduplicating recent streaming messages
  const combinedMessages = useMemo(() => {
    const loaded = messages.map((m) => ({
      key: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      structured: undefined as AIStructuredResponse | undefined,
      isStreaming: false,
    }))

    // Only add external streaming messages that aren't already in DB history
    const loadedSet = new Set(loaded.map(m => m.content))
    const ext = externalMessages
      .filter(m => !loadedSet.has(m.content))
      .map((m, i) => {
        const isStreaming = isStreamingLast && i === lastExtIndex
        return { key: `ext-${i}`, ...m, isStreaming }
      })

    return [...loaded, ...ext]
  }, [messages, externalMessages, isStreamingLast, lastExtIndex])

  return (
    <div className='relative flex-1'>
      <Conversation className='flex-1'>
        <ConversationContent>
          {!sessionId && !isLoadingExternal ? (
            <div className='flex items-center justify-center h-full text-muted-foreground'>
              Ask a question to get AI-powered mentorship
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
                  <span className='text-sm'>Generating response...</span>
                </div>
              ) : (
                <div className='text-center text-muted-foreground py-8'>
                  Ask for startup ideas, career advice, or collaboration suggestions!
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-2 md:gap-3 max-w-3xl mx-auto w-full px-2'>
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
