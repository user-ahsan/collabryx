/**
 * ============================================================================
 * AssistantContent — AI Assistant Page with Session Sidebar
 * ============================================================================
 *
 * Production-ready AI Assistant featuring:
 *  - SessionSidebar for browsing/resuming past conversations
 *  - Starter cards for common actions
 *  - Full Glass-glow themed UI
 *  - Streaming-aware ChatInput with attachments
 *  - No mock data — all real streaming from useAIStream
 *
 * @see {@link ../../components/features/ai-mentor/session-sidebar.tsx}
 * @see {@link ../../hooks/use-ai-stream.ts}
 * ============================================================================
 */
"use client"

import { useState, useMemo } from "react"
import { ChatInput } from "@/components/features/assistant/chat-input"
import { ChatList } from "@/components/features/assistant/chat-list"
import { ChatErrorBoundary } from "@/components/features/assistant/chat-error-boundary"
import { SessionSidebar } from "@/components/features/ai-mentor/session-sidebar"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Sparkles, Target, Zap, Menu, X } from "lucide-react"
import { useAIStream } from "@/hooks/use-ai-stream"
import { useAuth } from "@/hooks/use-auth"

const STARTERS = [
    { icon: Target, title: "Find a Co-founder", desc: "Help me find a technical co-founder for my fintech startup." },
    { icon: Zap, title: "Profile Review", desc: "Analyze my profile and suggest improvements to attract investors." },
    { icon: Sparkles, title: "Project Ideas", desc: "Give me 3 project ideas based on my skills in React and Python." },
]

export default function AssistantContent() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

    const { messages, isStreaming, sendMessage, error, sessionId, status, abort } = useAIStream({
        userId: user?.id ?? '',
        sessionId: activeSessionId ?? undefined,
        onSessionReady: (sid) => {
            setActiveSessionId(sid)
            setShowStarters(false)
        },
    })

    const handleSessionSelect = (sid: string) => {
        setActiveSessionId(sid)
        setSidebarOpen(false)
        setShowStarters(false)
    }

    const handleNewSession = () => {
        setActiveSessionId(null)
        setShowStarters(true)
    }

    // Reset starters when user is in a fresh session (no messages, no active session)
    useEffect(() => {
        if (messages.length === 0 && !activeSessionId) {
            setShowStarters(true)
        }
    }, [messages.length, activeSessionId])

    const effectiveSessionId = activeSessionId || sessionId

    const externalMessages = useMemo(() => messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
    })), [messages])

    const handleStarterClick = (desc: string) => {
        sendMessage(desc)
        setShowStarters(false)
    }

    const showStarterCards = showStarters && messages.length === 0 && !isStreaming

    return (
        <div className="flex flex-1 min-h-0">
            {/* Session Sidebar */}
            {sidebarOpen && (
                <>
                    {/* Mobile backdrop overlay */}
                    <div
                        className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
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

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <div className={cn("px-4 md:px-6 py-4 border-b border-border/40 shrink-0", glass("header"))}>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((o) => !o)}
                            className={cn(
                                "flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200",
                                "hover:bg-accent active:scale-95",
                                glass("buttonGhost"),
                            )}
                            aria-label="Toggle session sidebar"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-base md:text-lg font-semibold leading-tight">AI Assistant</h1>
                                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                                    Project management, collaboration & productivity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mx-4 mt-2 bg-destructive/10 text-destructive p-2.5 rounded-md text-xs md:text-sm shrink-0">
                        {error?.message || "An unexpected error occurred."}
                    </div>
                )}

                {/* Chat messages */}
                <ChatList
                    sessionId={effectiveSessionId}
                    externalMessages={externalMessages}
                    isLoadingExternal={isStreaming}
                    hasStarters={messages.length > 0}
                    onToggleStarters={() => setShowStarters((s) => !s)}
                />

                {/* Bottom area: starter cards + input */}
                <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
                    {showStarterCards && (
                        <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto">
                                {STARTERS.map((s) => (
                                    <GlassCard
                                        key={s.title}
                                        hoverable
                                        className="p-4 active:scale-[0.98] cursor-pointer"
                                        innerClassName="space-y-2"
                                        onClick={() => handleStarterClick(s.desc)}
                                    >
                                        <div className="flex items-center gap-2.5 font-semibold text-primary">
                                            <div className="rounded-lg bg-primary/10 p-1.5">
                                                <s.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm">{s.title}</span>
                                        </div>
                                        <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2">
                                            {s.desc}
                                        </p>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 md:p-5 max-w-3xl mx-auto">
                        <ChatErrorBoundary>
                            <ChatInput isStreaming={isStreaming} onSend={sendMessage} status={status} onStop={abort} />
                        </ChatErrorBoundary>
                        <p className="text-[11px] text-center text-muted-foreground/60 mt-2.5 px-2">
                            AI can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
