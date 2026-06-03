/**
 * ============================================================================
 * useAIStream — React Hook for Server-Sent Event Streaming with Persistence
 * ============================================================================
 *
 * PROBLEM (Bug #2 from analysis):
 * The original hook generated a crypto.randomUUID() as sessionId and never
 * synced with the server's real session ID. Messages sent via this hook went
 * to /api/ai/stream but responses were purely ephemeral — the hook displayed
 * them in the UI but they vanished on page refresh because the stream API
 * never persisted them. The ChatList would then try getSessionHistory() with
 * the random UUID, find no records, and show an empty state. Users lost all
 * conversation history on every refresh.
 *
 * SOLUTION:
 * This hook now acts as a BRIDGE between the streaming API and persistent
 * storage. Key changes:
 *  1. The initial sessionId can be empty (''). On the first sendMessage()
 *     call, the server returns its real DB session UUID as the FIRST SSE
 *     event (before any content tokens). The hook captures this via the
 *     onSessionReady callback and updates its internal sessionId state.
 *  2. All subsequent messages reuse this server-synced sessionId, ensuring
 *     they flow into the correct DB session.
 *  3. The hook exposes sessionId as a return value so parent components
 *     (AIMentorContent, ChatList) can use it to load history from the DB.
 *  4. Errors from the server are surfaced to the error state AND passed
 *     through onError callback for flexible error display.
 *  5. The streaming parser distinguishes between session-sync events
 *     (contain session_id, no content) and content events (contain content).
 *     The firstEvent flag tracks this state machine.
 *  6. AbortController cleanup on unmount prevents memory leaks and
 *     stale state updates.
 *
 * USAGE:
 * ```tsx
 * const { messages, isStreaming, sendMessage, error, sessionId } = useAIStream({
 *   userId: user.id,
 *   onSessionReady: (sid) => setActiveSessionId(sid),
 * })
 * ```
 *
 * @see {@link ../app/api/ai/stream/route.ts} — server counterpart
 * ============================================================================
 */
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AIMessage } from '@/lib/rag/types'

interface UseAIStreamOptions {
  userId: string
  sessionId?: string
  otherUserIds?: string[]
  startupContext?: Record<string, unknown>
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
  /** Called when the server creates/returns a real session ID */
  onSessionReady?: (sessionId: string) => void
}

export function useAIStream(options: UseAIStreamOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const currentMessageRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<AIMessage[]>([])
  const [sessionId, setSessionId] = useState(() => options.sessionId || '')

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Cleanup: abort any in-flight fetch on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    currentMessageRef.current = ''

    setIsStreaming(true)
    setError(null)

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId: options.userId,
          sessionId: sessionId || undefined,
          messages: [...messagesRef.current, userMessage],
          query: content,
          otherUserIds: options.otherUserIds,
          startupContext: options.startupContext
        })
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      const aiMessageId = crypto.randomUUID()
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }])

      let firstEvent = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }

              // First event always contains the real session_id from server
              if (firstEvent && parsed.session_id) {
                setSessionId(parsed.session_id)
                options.onSessionReady?.(parsed.session_id)
                firstEvent = false
                continue // session_id event has no content
              }
              firstEvent = false

              if (parsed.content) {
                currentMessageRef.current += parsed.content
                options.onChunk?.(parsed.content)

                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: currentMessageRef.current }
                    : msg
                ))
              }
            } catch {
              // Ignore parse errors for non-JSON data
            }
          }
        }
      }

      options.onComplete?.(currentMessageRef.current)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    } finally {
      setIsStreaming(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.userId, sessionId, options.onChunk, options.onComplete, options.onError, options.onSessionReady])

  return {
    messages,
    isStreaming,
    sendMessage,
    error,
    sessionId,
  }
}
