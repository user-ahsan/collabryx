"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface ChatSidebarProps {
    className?: string
    selectedId?: string
}

const CONVERSATIONS = [
    {
        id: "1",
        name: "Sarah Chen",
        avatar: "/avatars/01.png",
        lastMessage: "Hey! I saw your profile and thought we'd be a great match.",
        time: "2m ago",
        unread: 2,
    },
    {
        id: "2",
        name: "Alex Rivera",
        avatar: "/avatars/02.png",
        lastMessage: "Do you have time to chat about the project requirements?",
        time: "1h ago",
        unread: 0,
    },
    {
        id: "3",
        name: "James Wilson",
        avatar: "/avatars/03.png",
        lastMessage: "Thanks for connecting!",
        time: "1d ago",
        unread: 0,
    },
]

export function ChatSidebar({ className, selectedId }: ChatSidebarProps) {
    return (
        <div className={cn("flex flex-col h-full border-r", className)}>
            <div className="p-4 border-b space-y-4">
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
                    {CONVERSATIONS.map((chat) => (
                        <button
                            key={chat.id}
                            className={cn(
                                "flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors",
                                selectedId === chat.id && "bg-muted"
                            )}
                        >
                            <Avatar>
                                <AvatarImage src={chat.avatar} />
                                <AvatarFallback>{chat.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-sm">{chat.name}</span>
                                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {chat.lastMessage}
                                </p>
                            </div>
                            {chat.unread > 0 && (
                                <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {chat.unread}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
