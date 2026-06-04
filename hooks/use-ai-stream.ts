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
 *  7. NEW: Exposes `status` (ChatStatus) for PromptInputSubmit integration
 *     and `abort` function to stop streaming on user request.
 *     Status tracking: submitted → streaming → (done/error)
 *
 * USAGE:
 * ```tsx
 * const { messages, isStreaming, sendMessage, error, sessionId, status, abort } = useAIStream({
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
import type { ChatStatus } from 'ai'

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

/** Upload a file blob to the AI chat upload endpoint and return the public URL */
export async function uploadChatFile(
  blobUrl: string,
  filename: string,
  mediaType: string
): Promise<{ url: string; filename: string; mediaType: string } | null> {
  try {
    // Fetch the blob data from the blob URL
    const blobRes = await fetch(blobUrl)
    const blob = await blobRes.blob()
    const file = new File([blob], filename, { type: mediaType })

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/ai/upload', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('Failed to upload chat file:', err)
    return null
  }
}

export function useAIStream(options: UseAIStreamOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  type StreamStatus = ChatStatus | 'awaiting_input' | 'ready'
  const [status, setStatus] = useState<StreamStatus>('awaiting_input')
  const statusRef = useRef<StreamStatus>('awaiting_input')
  const currentMessageRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<AIMessage[]>([])
  const [sessionId, setSessionId] = useState(() => options.sessionId || '')
  const prevSessionIdRef = useRef(options.sessionId)
  const isStreamingRef = useRef(false)

  // Keep isStreamingRef in sync for use in the session-sync effect below
  useEffect(() => {
    isStreamingRef.current = isStreaming
  }, [isStreaming])

  // Sync internal sessionId when parent passes a different sessionId.
  // This handles TWO cases:
  //
  // Case A: "New Session" — activeSessionId changes from a real UUID to null.
  //   → Clear internal state so the next sendMessage creates a fresh DB session.
  //
  // Case B: User clicks a past session — activeSessionId changes to a different UUID.
  //   → Clear messages so ChatList loads the new session's history from DB.
  //
  // CRITICAL: We must NOT clear messages when the sessionId is being set by the
  // streaming hook itself (via onSessionReady). Example flow:
  //   1. User sends message (activeSessionId=null)
  //   2. Server creates session, returns session_id in SSE
  //   3. onSessionReady(sid) fires → parent sets activeSessionId=sid
  //   4. This effect fires because options.sessionId changed (undefined → sid)
  //   5. If we cleared messages here, we'd DESTROY the in-flight streaming content!
  //
  // We detect this by checking isStreamingRef: if we're actively streaming AND
  // the previous value was falsy, this is a natural session creation, not a
  // user-initiated session switch.
  useEffect(() => {
    const prev = prevSessionIdRef.current
    prevSessionIdRef.current = options.sessionId

    if (options.sessionId !== prev) {
      if (!options.sessionId) {
        // Case A: "New Session" — always safe to clear
        setSessionId('')
        setMessages([])
        currentMessageRef.current = ''
      } else {
        // Case B: Session ID changed to a real value
        // If we're streaming AND prev was falsy, this is a natural session creation
        // from onSessionReady — DO NOT clear messages.
        if (isStreamingRef.current && !prev) {
          // Streaming created this session — just update the sessionId,
          // keep messages intact
          setSessionId(options.sessionId)
        } else {
          // User clicked a past session — clear and load new history
          setSessionId(options.sessionId)
          setMessages([])
          currentMessageRef.current = ''
        }
      }
    }
  }, [options.sessionId])

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

  /** Abort the current streaming request */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStatus('awaiting_input')
    setIsStreaming(false)
  }, [])

  interface SendFilesArg {
    url: string
    mediaType: string
    filename?: string
  }

  const sendMessage = useCallback(async (
    content: string,
    files?: SendFilesArg[],
    mentionedUserIds?: string[]
  ) => {
    // Build message content with file references
    let messageContent = content
    let fileContext = ''
    if (files && files.length > 0) {
      fileContext = files.map(f =>
        `[Attached: ${f.filename || 'file'} (${f.mediaType})${f.url ? ` - ${f.url}` : ''}]`
      ).join('\n')
      messageContent = content
        ? `${content}\n\n${fileContext}`
        : fileContext
    }

    // Merge explicit mention IDs with existing collaboration user IDs
    const allOtherUserIds: string[] = []
    if (options.otherUserIds) allOtherUserIds.push(...options.otherUserIds)
    if (mentionedUserIds && mentionedUserIds.length > 0) allOtherUserIds.push(...mentionedUserIds)

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    currentMessageRef.current = ''

    setIsStreaming(true)
    setStatus('submitted')
    statusRef.current = 'submitted'
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
          query: messageContent,
          files: files?.map(f => ({ url: f.url, mediaType: f.mediaType, filename: f.filename })),
          otherUserIds: allOtherUserIds.length > 0 ? allOtherUserIds : undefined,
          mentionedUserIds: mentionedUserIds && mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
          startupContext: options.startupContext,
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

              // Once we get the first content token, switch to streaming status
              if (statusRef.current === 'submitted' && parsed.content) {
                setStatus('streaming')
                statusRef.current = 'streaming'
              }

              if (parsed.content) {
                currentMessageRef.current += parsed.content
                options.onChunk?.(parsed.content)

                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: currentMessageRef.current }
                    : msg
                ))
              }

              // Handle server-extracted startup ideas (structured data event)
              if (parsed.ideas && Array.isArray(parsed.ideas)) {
                // Ideas are received; they'll be rendered by the
                // StartupPlanGenerator from the content markers too,
                // but this structured event provides a fallback.
                console.debug(`📦 ${parsed.ideas.length} startup idea(s) extracted server-side`)
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
      setStatus('error')
      statusRef.current = 'error'
      options.onError?.(error)
    } finally {
      setIsStreaming(false)
      if (statusRef.current !== 'error') {
        setStatus('awaiting_input')
        statusRef.current = 'awaiting_input'
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.userId, sessionId, options.onChunk, options.onComplete, options.onError, options.onSessionReady])

  return {
    messages,
    isStreaming,
    sendMessage,
    error,
    sessionId,
    status,
    abort,
  }
}
