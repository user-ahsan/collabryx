"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { QUERY_PRESETS } from "@/lib/query-cache"

export const CONVERSATIONS_QUERY_KEY = ["conversations"] as const

interface Conversation {
    id: string
    other_user_id: string
    other_user_name: string
    other_user_avatar: string
    last_message: string
    last_message_time: string
    unread_count: number
}

async function fetchConversations(): Promise<Conversation[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

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

    if (conversationsError) {
        console.error("Failed to fetch conversations:", conversationsError)
        throw conversationsError
    }

    const conversationsPromises = (conversations || []).map(async (conv) => {
        const isParticipant1 = conv.participant_1 === user.id
        const otherUser = isParticipant1 ? conv.receiver?.[0] : conv.requester?.[0]
        const unreadCount = isParticipant1 ? conv.unread_count_1 : conv.unread_count_2

        return {
            id: conv.id,
            other_user_id: otherUser?.id || "",
            other_user_name: otherUser?.display_name || otherUser?.full_name || "Unknown",
            other_user_avatar: otherUser?.avatar_url || "",
            last_message: conv.last_message_text || "Start a conversation",
            last_message_time: formatTimeAgo(conv.last_message_at),
            unread_count: unreadCount || 0,
        } as Conversation
    })

    return Promise.all(conversationsPromises)
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

interface UseConversationsReturn {
    conversations: Conversation[]
    isLoading: boolean
    error: Error | null
    refreshConversations: () => Promise<void>
}

export function useConversations(): UseConversationsReturn {
    const { data: conversations = [], isLoading, error, refetch } = useQuery({
        queryKey: CONVERSATIONS_QUERY_KEY,
        queryFn: fetchConversations,
        staleTime: QUERY_PRESETS.realtime.staleTime,
        gcTime: QUERY_PRESETS.realtime.gcTime,
        retry: 1,
    })

    return {
        conversations,
        isLoading,
        error: error as Error | null,
        refreshConversations: async () => {
            await refetch()
        },
    }
}
