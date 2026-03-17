"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, MoreVertical, Phone, Video } from "lucide-react"
import { MessageInput } from "./message-input"
import { glass } from "@/lib/utils/glass-variants"

interface ChatWindowProps {
    chatId?: string
    onBackToList?: () => void
    isConnected?: boolean | null
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

export function ChatWindow({ chatId, onBackToList, isConnected }: ChatWindowProps) {
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
            <div className={cn(
                "flex items-center justify-between p-3 md:p-4",
                glass("divider"),
                "border-b"
            )}>
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Back button - only on mobile */}
                    <Button
                        aria-label="Go back"
                        variant="ghost"
                        size="icon-lg"
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
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm md:text-base">Sarah Chen</h3>
                            {isConnected === true && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                    Connected
                                </Badge>
                            )}
                            {isConnected === false && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                                    Not Connected
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <Button aria-label="Voice call" variant="ghost" size="icon-lg">
                        <Phone className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button aria-label="Video call" variant="ghost" size="icon-lg">
                        <Video className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button aria-label="More options" variant="ghost" size="icon-lg">
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
                                    "rounded-2xl p-2.5 md:p-3 text-sm max-w-[95%] md:max-w-[80%] shadow-sm transition-all",
                                    msg.senderId === "me"
                                        ? "bg-primary/90 backdrop-blur-md text-primary-foreground rounded-br-none shadow-[0_4px_32px_0_rgba(59,130,246,0.06)]"
                                        : "bg-background/40 backdrop-blur-md rounded-bl-none border border-border/40"
                                )}
                            >
                                {msg.text}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
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
