"use client"

import { ChatSidebar } from "@/components/features/messages/chat-sidebar"
import { ChatWindow } from "@/components/features/messages/chat-window"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
    const [selectedChatId, setSelectedChatId] = useState<string | null>("1")
    const [mobileView, setMobileView] = useState<"list" | "chat">("chat")

    const handleSelectChat = (id: string) => {
        setSelectedChatId(id)
        setMobileView("chat")
    }

    const handleBack = () => {
        setMobileView("list")
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] border rounded-lg overflow-hidden bg-background relative">
            {/* Sidebar: Visible on desktop, togglable on mobile */}
            <div className={cn(
                "w-full md:w-80 flex-col md:flex absolute inset-0 z-10 bg-background md:relative",
                mobileView === "list" ? "flex" : "hidden"
            )}>
                <ChatSidebar
                    selectedId={selectedChatId || undefined}
                    onSelect={handleSelectChat}
                />
            </div>

            {/* Chat Window: Visible on desktop, togglable on mobile */}
            <div className={cn(
                "flex-1 flex-col flex absolute inset-0 z-20 bg-background md:relative",
                 mobileView === "chat" ? "flex" : "hidden md:flex"
            )}>
                <ChatWindow
                    chatId={selectedChatId || undefined}
                    onBack={handleBack}
                />
            </div>
        </div>
    )
}
