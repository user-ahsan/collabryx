"use client"

import { ChatSidebar } from "@/components/features/messages/chat-sidebar"
import { ChatWindow } from "@/components/features/messages/chat-window"
import { useState } from "react"

export default function MessagesPage() {
    const [selectedChatId, setSelectedChatId] = useState<string | null>("1")
    const [showSidebar, setShowSidebar] = useState(true)

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId)
        setShowSidebar(false)
    }

    const handleBackToList = () => {
        setShowSidebar(true)
    }

    return (
        <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] border rounded-lg overflow-hidden bg-background">
            {/* Sidebar - Show on desktop or when showSidebar is true on mobile */}
            <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col`}>
                <ChatSidebar selectedId={selectedChatId || undefined} onSelectChat={handleSelectChat} />
            </div>

            {/* Chat Window - Show on desktop or when showSidebar is false on mobile */}
            <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
                <ChatWindow chatId={selectedChatId || undefined} onBackToList={handleBackToList} />
            </div>
        </div>
    )
}
