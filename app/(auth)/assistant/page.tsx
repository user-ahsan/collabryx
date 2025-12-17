import { ChatInput } from "@/components/features/assistant/chat-input"
import { ChatList } from "@/components/features/assistant/chat-list"
import { Card } from "@/components/ui/card"
import { Sparkles, Target, Zap } from "lucide-react"

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

export default function AssistantPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2 p-4 border-b">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="font-bold text-lg">AI Mentor</h1>
            </div>

            <ChatList />

            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                    {STARTERS.map((s) => (
                        <Card key={s.title} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors text-xs">
                            <div className="flex items-center gap-2 mb-1.5 font-semibold text-primary">
                                <s.icon className="h-3 w-3" />
                                {s.title}
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                                {s.desc}
                            </p>
                        </Card>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto w-full">
                    <ChatInput />
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    )
}
