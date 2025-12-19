"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { MessageInput } from "./message-input"

interface ChatWindowProps {
    chatId?: string
    onBackToList?: () => void
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

export function ChatWindow({ chatId, onBackToList }: ChatWindowProps) {
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
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Back button - only on mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden shrink-0"
                        onClick={onBackToList}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm md:text-base">Sarah Chen</h3>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                        <Phone className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                        <Video className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                        <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="space-y-3 md:space-y-4">
                    {MESSAGES.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full flex-col",
                                msg.senderId === "me" ? "items-end" : "items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-lg p-2.5 md:p-3 text-sm max-w-[95%] md:max-w-[80%]",
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
