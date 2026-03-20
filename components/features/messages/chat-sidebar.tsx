"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useConversations } from "@/hooks/use-conversations"
import { formatInitials } from "@/lib/utils/format-initials"

interface ChatSidebarProps {
    className?: string
    selectedId?: string
    onSelectChat?: (chatId: string) => void
}

export function ChatSidebar({ className, selectedId, onSelectChat }: ChatSidebarProps) {
    const { conversations, isLoading } = useConversations()

    return (
        <div className={cn("flex flex-col h-full border-r", className)}>
            <div className="p-3 md:p-4 border-b space-y-3 md:space-y-4">
                <h2 className="font-semibold text-lg">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search messages..."
                        className="pl-8"
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Loading conversations...
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat?.(chat.id)}
                                className={cn(
                                    "flex items-start gap-3 md:gap-4 p-3 md:p-4 text-left hover:bg-muted/50 transition-colors w-full",
                                    selectedId === chat.id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={chat.other_user_avatar} />
                                    <AvatarFallback>{formatInitials(chat.other_user_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm truncate">{chat.other_user_name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{chat.last_message_time}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 truncate">
                                        {chat.last_message}
                                    </p>
                                </div>
                                {chat.unread_count > 0 && (
                                    <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] shrink-0">
                                        {chat.unread_count}
                                    </Badge>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
