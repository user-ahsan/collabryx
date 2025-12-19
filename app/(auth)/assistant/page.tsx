"use client"

import { ChatInput } from "@/components/features/assistant/chat-input"
import { ChatList } from "@/components/features/assistant/chat-list"
import { AIOutputWorkspace } from "@/components/features/assistant/ai-output-workspace"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Target, Zap, FileText } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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

// Mock AI-generated content for demonstration
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

export default function AssistantPage() {
    const [workspaceOpen, setWorkspaceOpen] = useState(false)
    const [workspaceContent, setWorkspaceContent] = useState("")

    const handleOpenWorkspace = (content: string) => {
        setWorkspaceContent(content)
        setWorkspaceOpen(true)
    }

    const handleSaveToProfile = (content: string) => {
        // In a real app, this would save to the user's profile
        toast.success("Content saved to your Projects section!")
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between px-3 py-3 md:p-4 border-b">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <h1 className="font-bold text-base md:text-lg">AI Mentor</h1>
                </div>

                {/* Demo button to show workspace */}
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

            <ChatList />

            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto">
                    {STARTERS.map((s) => (
                        <Card key={s.title} className="p-3 md:p-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors text-xs">
                            <div className="flex items-center gap-2 mb-1.5 font-semibold text-primary">
                                <s.icon className="h-3 w-3 shrink-0" />
                                <span className="text-xs md:text-xs">{s.title}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-[11px] md:text-xs">
                                {s.desc}
                            </p>
                        </Card>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto w-full">
                    <ChatInput />
                    <p className="text-[10px] text-center text-muted-foreground mt-2 px-2">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>

            {/* AI Output Workspace Panel */}
            <AIOutputWorkspace
                content={workspaceContent}
                isOpen={workspaceOpen}
                onClose={() => setWorkspaceOpen(false)}
                onSaveToProfile={handleSaveToProfile}
            />
        </div>
    )
}
