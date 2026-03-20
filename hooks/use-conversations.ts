"use client"

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

            // Fetch accepted connections
            const { data: connections, error: connectionsError } = await supabase
                .from("connections")
                .select(`
                    id,
                    requester_id,
                    receiver_id,
                    updated_at,
                    requester:profiles!connections_requester_id_fkey (
                        id,
                        display_name,
                        full_name,
                        avatar_url
                    ),
                    receiver:profiles!connections_receiver_id_fkey (
                        id,
                        display_name,
                        full_name,
                        avatar_url
                    )
                `)
                .eq("status", "accepted")
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order("updated_at", { ascending: false })

            if (connectionsError) throw connectionsError

            // For each connection, get the last message
            const conversationsPromises = (connections || []).map(async (conn) => {
                const isRequester = conn.requester_id === user.id
                // Access the first element since the select returns an array
                const otherUser = isRequester ? (conn.receiver?.[0] ?? null) : (conn.requester?.[0] ?? null)
                
                // Get last message from messages table
                const { data: lastMessage } = await supabase
                    .from("messages")
                    .select("content, created_at")
                    .eq("conversation_id", conn.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single()

                // Get unread count
                const { count: unreadCount } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("conversation_id", conn.id)
                    .eq("receiver_id", user.id)
                    .eq("is_read", false)

                return {
                    id: conn.id,
                    other_user_id: otherUser?.id || "",
                    other_user_name: otherUser?.display_name || otherUser?.full_name || "Unknown",
                    other_user_avatar: otherUser?.avatar_url || "",
                    last_message: lastMessage?.content || "Start a conversation",
                    last_message_time: formatTimeAgo(lastMessage?.created_at || conn.updated_at),
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
