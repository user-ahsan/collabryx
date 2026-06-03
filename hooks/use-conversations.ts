"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { QUERY_PRESETS } from "@/lib/query-cache"
import { formatTimeAgo } from "@/lib/utils/time-ago"

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
            requester:profiles!inner (
                id,
                display_name,
                full_name,
                avatar_url
            ),
            receiver:profiles!inner (
                id,
                display_name,
                full_name,
                avatar_url
            )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })

    if (conversationsError) {
        // New users won't have conversations — graceful empty state
        if (conversationsError.code === "PGRST116" || conversationsError.message?.includes("contains 0 rows")) {
            return []
        }
        console.warn("Failed to fetch conversations (may be new user):", conversationsError)
        return []
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

// formatTimeAgo now imported from @/lib/utils/time-ago (deduplicated)

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

// ===========================================
// BACKWARD-COMPATIBLE useChat (merged from use-chat.ts)
// ===========================================

export const CHAT_CONVERSATIONS_QUERY_KEY = CONVERSATIONS_QUERY_KEY

interface ChatConversation {
    id: string
    participant_1: string
    participant_2: string
    last_message_text?: string
    last_message_at?: string
    unread_count_1: number
    unread_count_2: number
    is_archived: boolean
    created_at: string
    other_user?: {
        display_name?: string
        avatar_url?: string
    }
}

interface UseChatReturn {
    conversations: ChatConversation[]
    isLoading: boolean
    error: Error | null
    selectedConversation: ChatConversation | null
    selectConversation: (id: string) => void
    refreshConversations: () => Promise<void>
}

export function useChat(): UseChatReturn {
    const queryClient = useQueryClient()
    const router = useRouter()

    const {
        data: conversations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
        queryFn: async () => {
            const rawConversations = await fetchConversations()
            return rawConversations.map(c => ({
                id: c.id,
                participant_1: '',
                participant_2: c.other_user_id,
                last_message_text: c.last_message,
                last_message_at: c.last_message_time,
                unread_count_1: c.unread_count,
                unread_count_2: 0,
                is_archived: false,
                created_at: '',
                other_user: {
                    display_name: c.other_user_name,
                    avatar_url: c.other_user_avatar,
                },
            })) as ChatConversation[]
        },
        staleTime: QUERY_PRESETS.realtime.staleTime,
        gcTime: QUERY_PRESETS.realtime.gcTime,
        retry: 1,
    })

    const selectConversation = useCallback(
        (id: string) => {
            const conv = conversations.find((c) => c.id === id)
            if (conv) {
                router.push(`/messages/${id}`)
            }
        },
        [conversations, router]
    )

    const refreshConversations = useCallback(async () => {
        await refetch()
    }, [refetch])

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel("chat-conversations")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "conversations" },
                () => { queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY }) }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "conversations" },
                () => { queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY }) }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [queryClient])

    return {
        conversations,
        isLoading,
        error: error as Error | null,
        selectedConversation: null,
        selectConversation,
        refreshConversations,
    }
}
