"use client"



// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"

interface Conversation {
    id: string
    other_user_id: string
    other_user_name: string
    other_user_avatar: string
    last_message: string
    last_message_time: string
    unread_count: number
}

interface UseConversationsReturn {
    conversations: Conversation[]
    isLoading: boolean
    error: string | null
    refreshConversations: () => Promise<void>
}

export function useConversations(): UseConversationsReturn {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchConversations = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setConversations([])
                setIsLoading(false)
                return
            }

            // Fetch conversations
            const { data: conversations, error: conversationsError } = await supabase
                .from("conversations")
                .select(`
                    id,
                    participant_1,
                    participant_2,
                    last_message_text,
                    last_message_at,
                    unread_count_1,
                    unread_count_2,
                    requester:profiles!conversations_participant_1_fkey (
                        id,
                        display_name,
                        full_name,
                        avatar_url
                    ),
                    receiver:profiles!conversations_participant_2_fkey (
                        id,
                        display_name,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order("last_message_at", { ascending: false, nullsFirst: false })

            // For each conversation, get the other user info
            const conversationsPromises = (conversations || []).map(async (conv) => {
                const isParticipant1 = conv.participant_1 === user.id
                const otherUser = isParticipant1 ? conv.receiver?.[0] : conv.requester?.[0]
                const unreadCount = isParticipant1 ? conv.unread_count_2 : conv.unread_count_1

                return {
                    id: conv.id,
                    other_user_id: otherUser?.id || "",
                    other_user_name: otherUser?.display_name || otherUser?.full_name || "Unknown",
                    other_user_avatar: otherUser?.avatar_url || "",
                    last_message: conv.last_message_text || "Start a conversation",
                    last_message_time: formatTimeAgo(conv.last_message_at),
                    unread_count: unreadCount || 0
                } as Conversation
            })

            const conversationsData = await Promise.all(conversationsPromises)
            setConversations(conversationsData)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch conversations"
            logger.app.error("Error fetching conversations", err)
            setError(errorMessage)
            setConversations([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    return {
        conversations,
        isLoading,
        error,
        refreshConversations: fetchConversations
    }
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

    return date.toLocaleDateString()
}
