"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, MoreVertical, Phone, Video } from "lucide-react"
import { MessageInput } from "./message-input"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"
import { glass } from "@/lib/utils/glass-variants"
import { useMessages } from "@/hooks/use-messages"
import { useTypingIndicator } from "@/hooks/use-typing-indicator"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatInitials } from "@/lib/utils/format-initials"

interface ChatWindowProps {
    chatId?: string
    onBackToList?: () => void
    isConnected?: boolean | null
}

interface ChatUserInfo {
    name: string
    avatar: string
    initials: string
}

export function ChatWindow({ chatId, onBackToList, isConnected }: ChatWindowProps) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [chatUserInfo, setChatUserInfo] = useState<ChatUserInfo | null>(null)
    const { messages, isLoading, markAsRead } = useMessages(chatId, currentUserId || undefined)
    const { isTyping, sendTypingEvent, clearTypingStatus } = useTypingIndicator(chatId, currentUserId || undefined)

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)
        }
        getUser()
    }, [])

    // Fetch chat partner info
    useEffect(() => {
        const fetchChatUserInfo = async () => {
            if (!chatId || !currentUserId) {
                setChatUserInfo(null)
                return
            }

            try {
                const supabase = createClient()
                
                // Get connection to find the other user
                const { data: connection } = await supabase
                    .from("connections")
                    .select(`
                        requester_id,
                        receiver_id,
                        requester:profiles!connections_requester_id_fkey (
                            display_name,
                            full_name,
                            avatar_url
                        ),
                        receiver:profiles!connections_receiver_id_fkey (
                            display_name,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq("id", chatId)
                    .single()

                if (connection) {
                    const isRequester = connection.requester_id === currentUserId
                    const otherUser = isRequester 
                        ? connection.receiver?.[0] 
                        : connection.requester?.[0]
                    
                    const name = otherUser?.display_name || otherUser?.full_name || "Unknown"
                    setChatUserInfo({
                        name,
                        avatar: otherUser?.avatar_url || "",
                        initials: formatInitials(name)
                    })
                }
            } catch (error) {
                // Fallback to default
                setChatUserInfo(null)
            }
        }

        fetchChatUserInfo()
    }, [chatId, currentUserId])

    // Mark messages as read when viewing conversation
    useEffect(() => {
        if (chatId && currentUserId) {
            markAsRead(chatId)
        }
    }, [chatId, currentUserId, markAsRead])

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
                        <AvatarImage src={chatUserInfo?.avatar || "/avatars/01.png"} />
                        <AvatarFallback>{chatUserInfo?.initials || "SC"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm md:text-base truncate max-w-[150px] md:max-w-none">
                                {chatUserInfo?.name || "Loading..."}
                            </h3>
                            {isConnected === true && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 shrink-0">
                                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                    Connected
                                </Badge>
                            )}
                            {isConnected === false && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 shrink-0">
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
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-8">
                            Loading messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                id={msg.id}
                                text={msg.text}
                                senderId={msg.sender_id}
                                currentUserId={currentUserId || ""}
                                isRead={msg.is_read}
                                readAt={msg.read_at}
                                createdAt={msg.created_at}
                                attachmentUrl={msg.attachment_url}
                                attachmentType={msg.attachment_type}
                            />
                        ))
                    )}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <TypingIndicator isTyping={true} />
                    )}
                </div>
            </ScrollArea>

            <MessageInput 
                conversationId={chatId}
                onTyping={() => sendTypingEvent(chatId)}
                onStopTyping={() => clearTypingStatus()}
            />
        </div>
    )
}
