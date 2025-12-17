"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { MessageInput } from "./message-input"

interface ChatWindowProps {
    chatId?: string
    onBack?: () => void
}

const MESSAGES = [
    {
        id: "1",
        senderId: "them",
        text: "Hey! I saw your profile and thought we'd be a great match.",
        time: "10:30 AM",
    },
    {
        id: "2",
        senderId: "me",
        text: "Hi Sarah! Thanks for reaching out. What specifically caught your eye?",
        time: "10:32 AM",
    },
    {
        id: "3",
        senderId: "them",
        text: "I really liked your experience with React and AI integration. avoiding overly complex solutions.",
        time: "10:35 AM",
    },
]

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
    if (!chatId) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    {/* Back Button (Mobile Only) */}
                    <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <Avatar>
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold">Sarah Chen</h3>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {MESSAGES.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex max-w-[80%] flex-col",
                                msg.senderId === "me" ? "ml-auto items-end" : "items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-lg p-3 text-sm",
                                    msg.senderId === "me"
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-muted rounded-bl-none"
                                )}
                            >
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">
                                {msg.time}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <MessageInput />
        </div>
    )
}
