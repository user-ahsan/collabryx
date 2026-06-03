/**
 * ============================================================================
 * AssistantContent — AI Assistant Page (Shared ChatInput Pattern)
 * ============================================================================
 *
 * WHY THIS CHANGE:
 * The ChatInput component's interface changed from:
 *   props: { sessionId, onMessageSent }
 * to:
 *   props: { isStreaming, onSend }
 *
 * This file was passing the OLD props (sessionId={sessionId} onMessageSent={() => {}})
 * which caused a TypeScript build error. Additionally, it was importing
 * getOrCreateActiveSession from lib/actions/ai-mentor.ts to create a server-side
 * session, but that function's result was never used for anything meaningful
 * since the old ChatInput was broken anyway.
 *
 * The fix replaces the manual session-loading pattern with the useAIStream
 * hook, matching the AI Mentor page's architecture. The hook:
 *  - Creates session server-side on first sendMessage
 *  - Syncs the real session ID via onSessionReady
 *  - Provides isStreaming state to disable input during generation
 *  - Provides sendMessage as the onSend callback for ChatInput
 *
 * Note: The rest of this page (starter cards, workspace panel, sample output)
 * remains unchanged — only the session loading and ChatInput wiring were
 * updated to match the new component interface.
 * ============================================================================
 */
"use client"

import { ChatInput } from "@/components/features/assistant/chat-input"
import { ChatList } from "@/components/features/assistant/chat-list"
import { AIOutputWorkspace } from "@/components/features/assistant/ai-output-workspace"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Sparkles, Target, Zap, FileText, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAIStream } from "@/hooks/use-ai-stream"
import { useAuth } from "@/hooks/use-auth"

const STARTERS = [
    {
        icon: Target,
        title: "Find a Co-founder",
        desc: "Help me find a technical co-founder for my fintech startup."
    },
    {
        icon: Zap,
        title: "Profile Review",
        desc: "Analyze my profile and suggest improvements to attract investors."
    },
    {
        icon: Sparkles,
        title: "Project Ideas",
        desc: "Give me 3 project ideas based on my skills in React and Python."
    }
]

const MOCK_AI_OUTPUT = `# Startup MVP Checklist

## Phase 1: Validation (Week 1-2)
- [ ] Define core problem and target audience
- [ ] Create landing page with email signup
- [ ] Conduct 15-20 customer interviews
- [ ] Validate pain points and willingness to pay

## Phase 2: Build (Week 3-6)
- [ ] Design wireframes and user flows
- [ ] Set up development environment
- [ ] Build core features (authentication, dashboard, key workflow)
- [ ] Implement basic analytics

## Phase 3: Launch (Week 7-8)
- [ ] Beta test with 10-15 early adopters
- [ ] Fix critical bugs and gather feedback
- [ ] Prepare marketing materials
- [ ] Launch on Product Hunt and relevant communities

## Key Metrics to Track
- User sign-ups
- Activation rate
- Feature usage
- Customer feedback scores

## Team Needs
Based on your profile, you should find:
- UI/UX Designer (Figma, user research)
- Backend Developer (Node.js, database design)
- Marketing/Growth lead (content, social media)`

export default function AssistantContent() {
    const { user } = useAuth()
    const [workspaceOpen, setWorkspaceOpen] = useState(false)
    const [workspaceContent, setWorkspaceContent] = useState("")
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const { messages, isStreaming, sendMessage, error } = useAIStream({
        userId: user?.id ?? '',
        onSessionReady: (sid) => {
            setSessionId(sid)
            setIsLoading(false)
        },
        onError: () => setIsLoading(false),
    })

    // If hook hasn't returned a session yet, show loading briefly
    useEffect(() => {
        if (user) {
            // Timeout in case stream isn't used immediately
            const timer = setTimeout(() => setIsLoading(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [user])

    const handleOpenWorkspace = (content: string) => {
        setWorkspaceContent(content)
        setWorkspaceOpen(true)
    }

    const handleSaveToProfile = () => {
        toast.success("Content saved to your Projects section!")
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading AI Mentor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] max-w-5xl mx-auto w-full">
            <div className={cn("flex items-center justify-between px-3 py-3 md:p-4", glass("divider"))}>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <h1 className="font-bold text-base md:text-lg">AI Mentor</h1>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenWorkspace(MOCK_AI_OUTPUT)}
                    className="text-xs md:text-sm px-2 md:px-4"
                >
                    <FileText className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden sm:inline">View Sample Output</span>
                    <span className="sm:hidden">Sample</span>
                </Button>
            </div>

            <ChatList sessionId={sessionId} />

            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto">
                    {STARTERS.map((s) => (
                        <GlassCard key={s.title} className="cursor-pointer p-3 hover:shadow-md active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-2 mb-1.5 font-semibold text-primary">
                                <s.icon className="h-3 w-3 shrink-0" />
                                <span className="text-xs md:text-xs">{s.title}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-[11px] md:text-xs">
                                {s.desc}
                            </p>
                        </GlassCard>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto w-full">
                    <ChatInput isStreaming={isStreaming} onSend={sendMessage} />
                    <p className="text-[10px] text-center text-muted-foreground mt-2 px-2">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>

            <AIOutputWorkspace
                content={workspaceContent}
                isOpen={workspaceOpen}
                onClose={() => setWorkspaceOpen(false)}
                onSaveToProfile={handleSaveToProfile}
            />
        </div>
    )
}
