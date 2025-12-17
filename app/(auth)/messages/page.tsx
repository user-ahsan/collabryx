import { ChatSidebar } from "@/components/features/messages/chat-sidebar"
import { ChatWindow } from "@/components/features/messages/chat-window"

export default function MessagesPage() {
    return (
        <div className="flex h-[calc(100vh-2rem)] border rounded-lg overflow-hidden bg-background">
            <div className="hidden md:flex w-80 flex-col">
                <ChatSidebar selectedId="1" />
            </div>
            <div className="flex-1 flex flex-col">
                <ChatWindow chatId="1" />
            </div>
        </div>
    )
}
