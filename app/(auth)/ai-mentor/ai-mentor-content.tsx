/**
 * ============================================================================
 * AIMentorContent — Orchestrator for AI Mentor Page with Session Management
 * ============================================================================
 *
 * PROBLEM (Bug #1, #2, #3 from analysis):
 * The original AIMentorContent had three critical flaws:
 *  1. It generated a random sessionId via `crypto.randomUUID()` that existed
 *     ONLY in the browser. This UUID was never persisted to the database.
 *  2. It passed this fake sessionId to BOTH the useAIStream hook AND the
 *     ChatInput component. The ChatInput tried to call a server action with
 *     this UUID, which always failed with "Session not found" because no
 *     ai_mentor_sessions row matched.
 *  3. The ChatList called getSessionHistory() with the same fake UUID on
 *     mount, always getting empty results. Users saw no history even when
 *     messages were displayed from streaming — those messages vanished on
 *     refresh.
 *
 * Additionally, there was no way to:
 *  - Browse past sessions
 *  - Switch between sessions
 *  - Archive old conversations
 *  - Start fresh without losing everything
 *
 * SOLUTION:
 * This component now acts as the CENTRAL ORCHESTRATOR for the AI Mentor
 * page, coordinating four sub-components into a cohesive experience:
 *
 *  1. SessionSidebar (left panel, togglable):
 *     - Lists all past sessions (active + archived)
 *     - Auto-refreshes via polling to pick up new sessions
 *     - Archive button per session
 *     - Click to switch active session
 *     - "New Session" button to clear active state
 *
 *  2. useAIStream hook:
 *     - Receives activeSessionId when user selects a past session
 *     - When no session is active, the first message creates one server-side
 *     - onSessionReady callback syncs the real DB session ID back to state
 *     - sendMessage is passed down to both ChatInput and suggestion handlers
 *
 *  3. ChatInput (bottom bar):
 *     - Receives isStreaming and onSend from this component
 *     - No direct knowledge of sessions, DB, or server actions
 *
 *  4. ChatList (main area):
 *     - Loads DB history via getSessionHistory(effectiveSessionId)
 *     - Merges DB messages with streaming messages (deduplicated by content)
 *     - Shows loading/empty/error states appropriately
 *
 * The effectiveSessionId logic:
 *  - If user selected a past session → use that
 *  - If in-flight streaming created a new session → use the streaming hook's
 *    sessionId (synced from server)
 *  - ChatList uses whichever is available to load history
 *
 * @see {@link ../../hooks/use-ai-stream.ts} — streaming hook
 * @see {@link ../../components/features/ai-mentor/session-sidebar.tsx} — session browser
 * ============================================================================
 */
'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAIStream } from '@/hooks/use-ai-stream'
import { useAuth } from '@/hooks/use-auth'
import { ChatList } from '@/components/features/assistant/chat-list'
import { ChatInput } from '@/components/features/assistant/chat-input'
import { SessionSidebar } from '@/components/features/ai-mentor/session-sidebar'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Lightbulb, Menu, X, Users } from 'lucide-react'
import type { AIStructuredResponse, StartupIdeaAction } from '@/types/ai-responses'
import { isAIStructuredResponse } from '@/types/ai-responses'

interface AIMentorContentProps {
  collaborateUserId?: string
  startupContextParam?: string
}

export default function AIMentorContent({ collaborateUserId, startupContextParam }: AIMentorContentProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const otherUserIds = useMemo(
    () => collaborateUserId ? [collaborateUserId] : undefined,
    [collaborateUserId]
  )
  const collabMessageSent = useRef(false)
  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null)

  const { messages, isStreaming, sendMessage, error, sessionId } = useAIStream({
    userId: user?.id ?? '',
    sessionId: activeSessionId ?? undefined,
    otherUserIds,
    startupContext: startupContextParam ? JSON.parse(startupContextParam) : undefined,
    onSessionReady: (sid) => {
      setActiveSessionId(sid)
      setRefreshKey((k) => k + 1)
    },
  })

  // Keep ref in sync so auto-send effect doesn't depend on sendMessage identity
  sendMessageRef.current = sendMessage

  // Auto-send collaboration message ONCE when page loads with ?collaborate=userId
  // This effect intentionally omits sendMessage from deps to avoid re-triggering
  // when the streaming hook recreates sendMessage after getting a session_id.
  // Using sendMessageRef.current ensures we always call the latest sendMessage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (collaborateUserId && user?.id && !collabMessageSent.current) {
      collabMessageSent.current = true
      const collaborationMessage = `I want to collaborate with this person. Give me 3 detailed startup ideas we could build together based on our combined skills and interests. For each idea, include a niche_score breakdown with overall, market_fit, skill_match, feasibility, and uniqueness scores. Make each idea a proper startup plan with problem, solution, target market, and why_you_two sections.`
      // Use setTimeout to ensure sendMessageRef is populated from the useAIStream hook
      // which may not be ready on the very first render
      const timer = setTimeout(() => {
        sendMessageRef.current?.(collaborationMessage)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [collaborateUserId, user?.id])

  // Session switching — reset when user picks a different session
  const handleSessionSelect = useCallback((sid: string) => {
    setActiveSessionId(sid)
    setSidebarOpen(false)
    setRefreshKey((k) => k + 1)
  }, [])

  const handleNewSession = useCallback(() => {
    // Clear active session and let the hook create a new one on next send
    setActiveSessionId(null)
    setRefreshKey((k) => k + 1)
  }, [])

  // Use the current session ID for the ChatList (either from server or in-flight)
  const effectiveSessionId = activeSessionId || sessionId

  const externalMessages = useMemo(() => {
    return messages.map((msg) => {
      let structured: AIStructuredResponse | undefined
      if (msg.role === 'assistant') {
        try {
          const parsed = JSON.parse(msg.content)
          if (isAIStructuredResponse(parsed)) structured = parsed
        } catch { /* not JSON */ }
      }
      return { role: msg.role as 'user' | 'assistant', content: msg.content, structured }
    })
  }, [messages])

  const handleSuggestionClick = useCallback((s: string) => sendMessage(s), [sendMessage])
  const handleIdeaAction = useCallback((ideaId: number, action: StartupIdeaAction) => {
    const m: Record<StartupIdeaAction, string> = {
      validate: `Tell me more about validating idea #${ideaId}`,
      find_cofounder: `Help me find a co-founder for idea #${ideaId}`,
      market_research: `Do market research for idea #${ideaId}`,
      build_mvp: `How do I build an MVP for idea #${ideaId}?`,
      competitor_analysis: `Analyze competitors for idea #${ideaId}`,
      fundraising: `How do I raise funds for idea #${ideaId}?`,
      team_building: `What team do I need for idea #${ideaId}?`,
      customer_interviews: `Help me plan customer interviews for idea #${ideaId}`,
    }
    sendMessage(m[action])
  }, [sendMessage])

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent' />
      </div>
    )
  }

  return (
    <div className='flex h-[calc(100vh-4rem)] max-w-6xl mx-auto'>
      {/* Session Sidebar */}
      {sidebarOpen && (
        <SessionSidebar
          activeSessionId={effectiveSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className='flex flex-col flex-1 min-w-0'>
        {/* Header */}
        <div className={cn('px-4 md:px-6 py-3 md:py-4 border-b', glass('header'))}>
          <div className='flex items-center gap-2'>
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-1 -ml-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Toggle session sidebar"
            >
              {sidebarOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
            </button>
            <div className='rounded-full bg-primary/10 p-1.5'>
              {collaborateUserId ? (
                <Users className='h-4 w-4 text-primary' />
              ) : (
                <Lightbulb className='h-4 w-4 text-primary' />
              )}
            </div>
            <h1 className='text-lg font-semibold'>
              {collaborateUserId ? 'Collaboration Studio' : 'AI Mentor'}
            </h1>
          </div>
          <p className='text-xs md:text-sm text-muted-foreground mt-0.5'>
            {collaborateUserId
              ? 'Brainstorming startup ideas to build together'
              : 'Get personalized startup ideas, collaboration advice, and general mentorship'
            }
          </p>
        </div>

        {error && (
          <div className='mx-4 mt-2 bg-destructive/10 text-destructive p-2.5 rounded-md text-xs md:text-sm'>
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </div>
        )}

        <ChatList
          sessionId={effectiveSessionId}
          externalMessages={externalMessages}
          isLoadingExternal={isStreaming}
          onSuggestionClick={handleSuggestionClick}
          onIdeaAction={handleIdeaAction}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />

        <div className={cn('border-t p-3 md:p-4 bg-background', glass('footer'))}>
          <ChatInput isStreaming={isStreaming} onSend={sendMessage} />
        </div>
      </div>
    </div>
  )
}
