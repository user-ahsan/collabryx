/**
 * ============================================================================
 * AIMentorContent — Orchestrator for AI Mentor Page with Session Management
 * ============================================================================
 *
 * Central orchestrator for the AI Mentor page. Integrates the collapsible
 * SessionSidebar, StartupPlanGenerator, and ChatList components.
 *
 * @see {@link ../../hooks/use-ai-stream.ts} — streaming hook
 * @see {@link ../../components/features/ai-mentor/session-sidebar.tsx} — session browser
 * ============================================================================
 */
'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useAIStream } from '@/hooks/use-ai-stream'
import { useAuth } from '@/hooks/use-auth'
import { ChatList } from '@/components/features/assistant/chat-list'
import { ChatInput } from '@/components/features/assistant/chat-input'
import { ChatErrorBoundary } from '@/components/features/assistant/chat-error-boundary'
import { SessionSidebar } from '@/components/features/ai-mentor/session-sidebar'
import { StartupPlanGenerator } from '@/components/features/ai-mentor/startup-plan-generator'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Lightbulb, Users, Sparkles, Menu, X } from 'lucide-react'
import type { AIStructuredResponse, StartupIdeaAction } from '@/types/ai-responses'
import { isAIStructuredResponse } from '@/types/ai-responses'
import { getSessionHistory } from '@/lib/actions/ai-mentor'

interface AIMentorContentProps {
  collaborateUserId?: string
  startupContextParam?: string
}

export default function AIMentorContent({ collaborateUserId, startupContextParam }: AIMentorContentProps) {
  const { user } = useAuth()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Sidebar Open State
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Auto-send collaboration message ONCE when page loads with ?collaborate=userId
  // This effect intentionally omits sendMessage from deps to avoid re-triggering
  // when the streaming hook recreates sendMessage after getting a session_id.
  // Using sendMessageRef.current ensures we always call the latest sendMessage.
  useEffect(() => {
    if (collaborateUserId && user?.id && !collabMessageSent.current) {
      collabMessageSent.current = true
      const collaborationMessage = `I want to collaborate with this person. Give me 3 detailed startup ideas we could build together based on our combined skills and interests. For each idea, include a niche_score breakdown with overall, market_fit, skill_match, feasibility, and uniqueness scores. Make each idea a proper startup plan with problem, solution, target market, and why_you_two sections.`
      // Retry loop: sendMessageRef may not be populated on first render because
      // the streaming hook needs to initialize. Try up to 10 times with 200ms gaps.
      const trySend = (attempts = 0) => {
        if (sendMessageRef.current) {
          sendMessageRef.current(collaborationMessage)
        } else if (attempts < 10) {
          setTimeout(() => trySend(attempts + 1), 200)
        }
      }
      trySend()
    }
  }, [collaborateUserId, user?.id])

  // Manual re-extraction: forces the AI's last assistant response through
  // the startup idea parser. Useful when --IDEA-- markers weren't generated.
  const [manualExtractText, setManualExtractText] = useState<string | null>(null)

  // Ideas-focused view mode — when active, hides chat and shows full-width cards
  // Users can manually click "Extract ideas" to view parsed startup ideas.
  // Auto-detection from --IDEA-- markers was intentionally removed (avoids setState-in-effect).
  const [ideasMode, setIdeasMode] = useState(false)
  const [ideasModeText, setIdeasModeText] = useState<string | null>(null)

  // Session switching — load messages for the selected session
  const handleSessionSelect = useCallback((sid: string) => {
    setActiveSessionId(sid)
    setRefreshKey((k) => k + 1)
    setIdeasMode(false)
    setIdeasModeText(null)
    setManualExtractText(null)
    setSidebarOpen(false)
  }, [])

  const handleNewSession = useCallback(() => {
    // Clear active session and let the hook create a new one on next send
    setActiveSessionId(null)
    setRefreshKey((k) => k + 1)
    setSidebarOpen(false)
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
  const handleExtractIdeas = useCallback(async () => {
    // First check streaming messages (from current session)
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistant) {
      setManualExtractText(lastAssistant.content)
      setIdeasMode(true)
      setIdeasModeText(lastAssistant.content)
      return
    }
    // Fallback: check DB-loaded messages if streaming hasn't happened yet
    if (effectiveSessionId) {
      try {
        const result = await getSessionHistory(effectiveSessionId)
        const dbMessages = result?.data
        if (dbMessages && dbMessages.length > 0) {
          const lastDbAssistant = [...dbMessages].reverse().find(
            (m: { role: string }) => m.role === 'assistant'
          )
          if (lastDbAssistant) {
            const content = (lastDbAssistant as { content: string }).content
            setManualExtractText(content)
            setIdeasMode(true)
            setIdeasModeText(content)
          }
        }
      } catch {
        // Silently ignore fetch errors
      }
    }
  }, [messages, effectiveSessionId])

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
    <div className='flex flex-1 min-h-0 relative'>
      {/* Session Sidebar */}
      {sidebarOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden overscroll-contain"
            onClick={() => setSidebarOpen(false)}
          />
          <SessionSidebar
            activeSessionId={effectiveSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className={cn('px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border/40 shrink-0', glass('header'))}>
          <div className='flex items-center justify-between gap-2 md:gap-3'>
            <div className='flex items-center gap-3 min-w-0'>
              {/* Hamburger toggle button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(o => !o)}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-all duration-200",
                  "hover:bg-accent active:scale-95",
                  glass("buttonGhost"),
                )}
                aria-label="Toggle session sidebar"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className='rounded-full bg-primary/10 p-2 shrink-0'>
                {collaborateUserId ? (
                  <Users className='h-4 w-4 text-primary' />
                ) : (
                  <Lightbulb className='h-4 w-4 text-primary' />
                )}
              </div>
              <div className="min-w-0">
                <h1 className='text-base md:text-lg font-semibold leading-tight truncate'>
                  {ideasMode ? 'Startup Ideas' : (collaborateUserId ? 'Collaboration Studio' : 'AI Mentor')}
                </h1>
                <p className='text-xs md:text-sm text-muted-foreground hidden sm:block truncate'>
                  {ideasMode
                    ? 'Enterprise-grade plans for your next venture'
                    : (collaborateUserId
                      ? 'Brainstorming startup ideas to build together'
                      : 'Startup ideas, mentorship & collaboration'
                    )
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {ideasMode && (
                <button
                  type="button"
                  onClick={() => { setIdeasMode(false); setIdeasModeText(null) }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                             bg-muted/50 text-muted-foreground hover:bg-muted transition-colors shrink-0"
                >
                  ← Back to chat
                </button>
              )}
              {!ideasMode && (
                <button
                  type="button"
                  onClick={handleExtractIdeas}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                             bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                  title="Parse startup ideas from the last AI response"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">Extract ideas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className='mx-4 mt-2 bg-destructive/10 text-destructive p-2.5 rounded-md text-xs md:text-sm shrink-0'>
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </div>
        )}

        {/* IDEAS-FOCUSED VIEW — full-width cards, no chat */}
        {ideasMode && ideasModeText ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-5xl mx-auto w-full px-6 py-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Startup Ideas</h2>
                <p className="text-sm text-muted-foreground">
                  Click any card to generate a full enterprise-grade plan
                </p>
              </div>
              <StartupPlanGenerator
                text={ideasModeText}
                sessionId={effectiveSessionId}
                userId={user?.id}
                className="!mt-0"
              />
            </div>
          </div>
        ) : (
          <>
            <ChatList
              sessionId={effectiveSessionId}
              externalMessages={externalMessages}
              isLoadingExternal={isStreaming}
              onSuggestionClick={handleSuggestionClick}
              onIdeaAction={handleIdeaAction}
              refreshKey={refreshKey}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              userId={user?.id}
            />

            {/* Manual idea extraction — renders cards from last AI response */}
            {manualExtractText && (
              <div className="px-4 md:px-6 py-2 shrink-0">
                <StartupPlanGenerator text={manualExtractText} sessionId={effectiveSessionId} userId={user?.id} />
              </div>
            )}
          </>
        )}

        <div className='border-t border-border/40 p-2 sm:p-3 md:p-4 bg-background/80 backdrop-blur-xl shrink-0'>
          <ChatErrorBoundary>
            <ChatInput onSend={sendMessage} />
          </ChatErrorBoundary>
        </div>
      </div>
    </div>
  )
}
