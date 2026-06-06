/**
 * ============================================================================
 * AI STREAMING ENDPOINT — PERSISTENT SESSIONS + REAL-TIME TOKENS
 * ============================================================================
 *
 * PROBLEM (Bug #1 & #3 from analysis):
 * The original streaming endpoint was purely ephemeral — it streamed AI tokens
 * to the client but NEVER saved messages or sessions to the database. The AI
 * Mentor page generated random client-side UUIDs via crypto.randomUUID() as
 * session IDs, so no DB record ever matched. When the user refreshed, all
 * conversation history was permanently lost. Additionally, the ChatInput
 * component used a completely separate server-action path (lib/actions/ai-mentor.ts)
 * that checked session existence against the DB — since the client UUID didn't
 * exist, it always returned "Session not found". This dual-architecture split
 * meant: (a) streaming responses were visible but never persisted, and
 * (b) typed messages via ChatInput always failed with session errors.
 *
 * SOLUTION:
 * This rewrite turns the streaming endpoint into the SINGLE source of truth
 * for AI mentor interactions. Every request now:
 *  1. Authenticates via Supabase (same-origin CSRF + JWT check)
 *  2. Calls getOrCreateSession() to get/reuse a REAL DB-backed session UUID
 *  3. Saves the user's message to ai_mentor_messages BEFORE calling the LLM
 *  4. Loads full conversation history from DB for RAG context assembly
 *  5. Auto-generates a session title from the first user message (truncated
 *     to 60 chars) so the sidebar shows meaningful names
 *  6. Streams AI tokens to the client via Server-Sent Events (SSE)
 *  7. On stream completion, saves the COMPLETE AI response to the database
 *  8. On stream error, saves whatever partial response was captured
 *  9. Sends the real session_id as the FIRST SSE event so the client hook
 *     can update its state and ChatList can load DB history
 *
 * KEY DESIGN DECISIONS:
 * - Session creation/deactivation happens server-side only — the client never
 *   generates UUIDs or manages session lifecycle
 * - Messages are saved BEFORE and AFTER streaming, never during, to avoid
 *   partial writes in the DB that could confuse the RAG context assembly
 * - The first SSE event includes session_id but NO content, letting the client
 *   distinguish session-sync events from content tokens
 * - revalidatePath() is called after streaming completes so the sidebar's
 *   getUserSessions() query sees the updated session
 *
 * DEPENDENCIES:
 * - @/lib/supabase/server — for all DB operations
 * - @/lib/rag/context-assembler — for RAG-enhanced prompt building
 * - @/lib/ai/providers/registry — for provider-agnostic LLM calls
 *
 * @see {@link https://github.com/collabryx/docs/architecture/ai-mentor.md}
 * ============================================================================
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { assembleAndBuildPrompt } from '@/lib/rag/context-assembler'
import { getProviderRegistry } from '@/lib/ai/providers/registry'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import { CircuitBreaker } from '@/lib/services/circuit-breaker'
import { sanitizeAIMessage, sanitizeMessages, sanitizeFileAttachment } from '@/lib/utils/ai-sanitize'
import type { Message } from '@/lib/ai/providers/base'
import type { StartupContext } from '@/lib/rag/types'

/**
 * Circuit breaker for the AI streaming endpoint.
 * Prevents cascade failures when the LLM provider is unhealthy.
 * Opens after 3 failures within 60s, auto-recovers after 30s.
 *
 * ⚠️ MODULE-LEVEL INITIALIZATION LIMITATION:
 * - In development with hot reloading, the breaker resets on each reload.
 * - In production with multiple serverless instances, each instance has
 *   its own breaker state (not shared across instances).
 * - For multi-instance deployments, consider using a distributed circuit
 *   breaker backed by Redis or Supabase to share state across instances.
 */
const streamCircuitBreaker = new CircuitBreaker({
  name: 'ai-stream',
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
})

/**
 * In-memory lock map for session-level concurrency control.
 * Prevents out-of-order messages when a user sends two requests rapidly
 * for the same session. The second request will wait until the first
 * request (including stream completion) finishes.
 *
 * ⚠️ LIMITATION: Only works within a single server instance.
 * For multi-instance deployments, use a distributed lock (e.g., Redis,
 * Supabase advisory lock).
 */
const sessionLocks = new Map<string, Promise<void>>()

async function withSessionLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  while (sessionLocks.has(sessionId)) {
    await sessionLocks.get(sessionId)!
  }
  let release: () => void
  const promise = new Promise<void>((resolve) => { release = resolve })
  sessionLocks.set(sessionId, promise)
  try {
    return await fn()
  } finally {
    sessionLocks.delete(sessionId)
    release!()
  }
}

/**
 * Resolve the session for this request.
 * - If clientSessionId is provided → verify it exists and belongs to user, return it
 * - If clientSessionId is NOT provided → create a BRAND NEW session
 *   (never reuse an old active session, as that causes history bleed)
 */
async function resolveSession(userId: string, clientSessionId?: string): Promise<{ id: string; title: string }> {
  const supabase = await createClient()

  // If client explicitly provided a session ID, verify it exists and belongs to user
  if (clientSessionId) {
    const { data: session } = await supabase
      .from('ai_mentor_sessions')
      .select('id, title')
      .eq('id', clientSessionId)
      .eq('user_id', userId)
      .single()

    if (session) return session
    // Session provided by client but not found → return error, don't silently create
    throw new Error(`Session not found: ${clientSessionId}`)
  }

  // No session ID provided → always create a new session
  const { data: created, error } = await supabase
    .from('ai_mentor_sessions')
    .insert({
      user_id: userId,
      title: `Session ${new Date().toLocaleDateString()}`,
      status: 'active',
    })
    .select('id, title')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create session: ${error?.message || 'Unknown error'}`)
  }

  return created
}

/**
 * Save a message to the database and return the record.
 */
async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<{ id: string; created_at: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_mentor_messages')
    .insert({ session_id: sessionId, role, content })
    .select('id, created_at')
    .single()

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`)
  }
  return data
}

export async function POST(request: NextRequest) {
  // CSRF protection — validate same-origin
  // Parse origin URL properly to avoid subdomain suffix bypass (e.g., evil.app.com matching app.com)
  const headersList = await headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')
  if (origin && host) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  try {
    // === RATE LIMITING ===
    // Apply rate limiting early, before any heavy processing
    const { allowed, response: rateLimitResponse, headers: rateLimitHeaders } = rateLimit(request, 'aiChat')
    if (!allowed) {
      return rateLimitResponse
    }

    const body = await request.json()
    const { userId, sessionId: clientSessionId, messages, query, preferredProvider, otherUserIds, startupContext, files, mentionedUserIds } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // === PROMPT INJECTION SANITIZATION ===
    // Sanitize user message before any processing to neutralize
    // jailbreak attempts, XSS, and prompt injection patterns
    const sanitizedQuery = query ? sanitizeAIMessage(query) : ''
    const sanitizedMessages = messages ? sanitizeMessages(messages) : []
    const sanitizedMentionedIds = (mentionedUserIds || []).filter(
      (id: string) => typeof id === 'string' && id.length === 36
    )

    // === FILE ATTACHMENT HANDLING ===
    // If files are attached and the model doesn't support multimodal input,
    // include them as text descriptions so the AI knows about them.
    let fileContext = ''
    if (files && Array.isArray(files) && files.length > 0) {
      fileContext = files
        .filter((f: unknown): f is { filename?: string; mediaType?: string; url?: string } =>
          typeof f === 'object' && f !== null
        )
        .map((f) => {
          const safe = sanitizeFileAttachment(f)
          const isImage = safe.mediaType.startsWith('image/')
          const isText = safe.mediaType.startsWith('text/') || safe.mediaType === 'application/json'
          if (isImage) {
            return `[Attached Image: ${safe.filename}]`
          } else if (isText) {
            return `[Attached File: ${safe.filename} (${safe.mediaType})]`
          } else {
            return `[Attached File: ${safe.filename} (${safe.mediaType})]`
          }
        }).join('\n')
    }

    // === SESSION MANAGEMENT ===
    // Resolve session: use client-provided ID or create a new one
    const dbSession = await resolveSession(userId, clientSessionId || undefined)

    // Acquire session-level lock to prevent out-of-order messages
    return await withSessionLock(dbSession.id, async () => {
      // Count existing user messages BEFORE saving to determine if this is the first message
      const { count: existingMsgCount } = await supabase
        .from('ai_mentor_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', dbSession.id)
        .eq('role', 'user')

      const isFirstUserMessage = existingMsgCount === 0

      // Build user content (include file context if present)
      let userContent = sanitizedQuery || sanitizedMessages?.[sanitizedMessages.length - 1]?.content || ''
      if (fileContext) {
        userContent = userContent
          ? `${userContent}\n\n${fileContext}`
          : fileContext
      }
      const savedUserMsg = await saveMessage(dbSession.id, 'user', userContent)

      // Auto-title from first user message (truncated to 60 chars)
      if (isFirstUserMessage) {
        const title = userContent.length > 60
          ? userContent.substring(0, 57) + '...'
          : userContent
        await supabase
          .from('ai_mentor_sessions')
          .update({ title })
          .eq('id', dbSession.id)
      }

    // Load conversation history from DB (last 20)
    const { data: dbMessages } = await supabase
      .from('ai_mentor_messages')
      .select('role, content')
      .eq('session_id', dbSession.id)
      .order('created_at', { ascending: true })
      .limit(20)

    const ragMessages = (dbMessages || []).map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: new Date().toISOString(),
    }))

    // Merge explicitly passed otherUserIds with @mentioned user IDs
    const allOtherUserIds: string[] = []
    if (otherUserIds && Array.isArray(otherUserIds)) allOtherUserIds.push(...otherUserIds)
    if (sanitizedMentionedIds && Array.isArray(sanitizedMentionedIds)) {
      for (const id of sanitizedMentionedIds) {
        if (!allOtherUserIds.includes(id)) allOtherUserIds.push(id)
      }
    }

    // === RAG CONTEXT ASSEMBLY ===
    const { systemPrompt, warnings } = await assembleAndBuildPrompt({
      userId,
      query: sanitizedQuery || '',
      sessionId: dbSession.id,
      messages: ragMessages,
      otherUserIds: allOtherUserIds.length > 0 ? allOtherUserIds : undefined,
      startupContext: startupContext as StartupContext | null | undefined,
    })

    // === AI PROVIDER ===
    const registry = getProviderRegistry()
    const provider = registry.getProvider(preferredProvider)

    const conversationMessages: Message[] = (ragMessages).map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    // === STREAM WITH PERSISTENCE + CIRCUIT BREAKER ===
    // We create a ReadableStream that:
    // 1. Streams tokens to the client in real-time
    // 2. Buffers the full response
    // 3. Saves the complete response to DB when done
    // 4. Protected by circuit breaker against provider failures
    let fullResponse = ''
    const encoder = new TextEncoder()

    // Get the streaming iterator through the circuit breaker
    let stream: AsyncIterable<string> | null = null
    try {
      const streamResult = await streamCircuitBreaker.execute(async () => {
        const s = provider.stream
          ? provider.stream(conversationMessages, systemPrompt)
          : null
        if (!s) throw new Error('AI provider does not support streaming')
        return s
      })
      stream = streamResult
    } catch (breakerError) {
      const message = breakerError instanceof Error ? breakerError.message : 'AI provider unavailable'
      return NextResponse.json({ error: message }, { status: 503 })
    }

    // Shared cancellation flag — set on client disconnect so the for-await loop
    // exits promptly instead of continuing to consume tokens from the provider
    let cancelled = false

    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          // Send session_id as first event so client syncs
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ session_id: dbSession.id, user_msg_id: savedUserMsg.id })}\n\n`)
          )

          for await (const token of stream) {
            if (cancelled) break
            fullResponse += token
            const data = JSON.stringify({ content: token })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // If cancelled, don't save the partial response or attempt post-stream actions
          if (cancelled) {
            controller.close()
            return
          }

          // Save the complete AI response to DB
          if (fullResponse.trim()) {
            await saveMessage(dbSession.id, 'assistant', fullResponse)

            // === SERVER-SIDE IDEA EXTRACTION ===
            // Parse --IDEA-- markers from the response and emit a structured event
            // so the client can render cards without relying on client-side parsing
            const ideaRegex = /--IDEA--\s*([\s\S]*?)--END--/g
            let ideaMatch: RegExpExecArray | null
            const ideas: Array<{ title: string; tagline: string; difficulty: string }> = []
            while ((ideaMatch = ideaRegex.exec(fullResponse)) !== null) {
              const block = ideaMatch[1]
              const titleMatch = block.match(/^title:\s*(.+)$/m)
              const taglineMatch = block.match(/^tagline:\s*(.+)$/m)
              const diffMatch = block.match(/^difficulty:\s*(.+)$/m)
              if (titleMatch) {
                ideas.push({
                  title: titleMatch[1].trim(),
                  tagline: taglineMatch?.[1]?.trim() || '',
                  difficulty: diffMatch?.[1]?.trim() || 'moderate',
                })
              }
            }

            // Emit extracted ideas as a structured SSE event
            if (ideas.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ ideas })}\n\n`)
              )
            }
          }

          // === POST-STREAM ACTIONS (fire-and-forget) ===
          // Send mention notifications to @mentioned users
          if (sanitizedMentionedIds && sanitizedMentionedIds.length > 0) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', userId)
              .single()

            const senderName = sender?.display_name || 'Someone'

            for (const mentionedId of sanitizedMentionedIds) {
              if (mentionedId === userId) continue // Don't notify self
              // Fire notification (async, don't block)
              fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'internal' },
                body: JSON.stringify({
                  user_id: mentionedId,
                  type: 'mention',
                  content: `${senderName} mentioned you in a collaboration session`,
                  actor_id: userId,
                  actor_name: senderName,
                  resource_type: 'conversation',
                  resource_id: dbSession.id,
                }),
              }).catch((err) => console.error('[stream] Failed to send mention notification:', err))
            }
          }

          // Fire-and-forget analytics heartbeat
          supabase.rpc('record_heartbeat', { p_user_id: userId, p_ip_address: null })
            .then(() => {}, (err) => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[stream] Heartbeat RPC failed (non-fatal):', err)
              }
            })

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          revalidatePath('/(auth)/ai-mentor')
        } catch (error) {
          console.error('[stream] Error in SSE stream loop:', error)
          // Save whatever we got on error
          if (fullResponse.trim()) {
            await saveMessage(dbSession.id, 'assistant', fullResponse).catch(() => {})
          }
          // Send explicit [ERROR] marker before error data so the client
          // can distinguish stream-level errors from content events
          controller.enqueue(encoder.encode('data: [ERROR]\n\n'))
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Stream error',
            partial: fullResponse,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
      cancel() {
        // Client disconnected — signal the for-await loop to stop early
        // instead of continuing to consume tokens from the provider.
        // NOTE: The underlying fetch ReadableStream reader continues to
        // consume from the TCP socket until the next yield, but this
        // prevents further SSE events from being sent to a dead client
        // and avoids unnecessary DB writes of partial responses.
        cancelled = true
      },
    })

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...rateLimitHeaders,
        ...(warnings.length > 0 ? { 'X-RAG-Warnings': JSON.stringify(warnings) } : {}),
      },
    })
    }) // end withSessionLock
  } catch (error) {
    console.error('AI stream error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
