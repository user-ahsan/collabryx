"use client"

import { ChatSidebar } from "./chat-sidebar"
import { ChatWindow } from "./chat-window"
import { useState } from "react"

interface MessagesClientProps {
    initialChatId?: string | null
}

export function MessagesClient({ initialChatId = null }: MessagesClientProps) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId)
    const [prevInitialChatId, setPrevInitialChatId] = useState<string | null>(initialChatId)
    const [showSidebar, setShowSidebar] = useState(true)

    if (initialChatId !== prevInitialChatId) {
        setPrevInitialChatId(initialChatId)
        if (initialChatId) {
            setSelectedChatId(initialChatId)
            setShowSidebar(false)
        }
    }

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId)
        setShowSidebar(false)
        // Optionally sync URL without refresh
        window.history.pushState(null, '', `/messages/${chatId}`)
    }

    const handleBackToList = () => {
        setShowSidebar(true)
        window.history.pushState(null, '', `/messages`)
    }

    return (
        <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] border rounded-lg overflow-hidden bg-background">
            <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full sm:w-80 md:w-96 flex-col`}>
                <ChatSidebar selectedId={selectedChatId || undefined} onSelectChat={handleSelectChat} />
            </div>

            <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
                <ChatWindow chatId={selectedChatId || undefined} onBackToList={handleBackToList} />
            </div>
        </div>
    )
}
