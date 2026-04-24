"use client"

import { useCallback, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { QUERY_PRESETS } from "@/lib/query-cache"

export const CHAT_CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const

interface Conversation {
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
    conversations: Conversation[]
    isLoading: boolean
    error: Error | null
    selectedConversation: Conversation | null
    selectConversation: (id: string) => void
    refreshConversations: () => Promise<void>
}

async function fetchChatConversations(): Promise<Conversation[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Not authenticated")
    }

    const { data, error } = await supabase
        .from("conversations")
        .select(`
            *,
            other_user:profiles!conversations_participant_2_fkey (
                display_name,
                avatar_url
            )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })

    if (error) throw error

    return (data || []).map((conv) => ({
        ...conv,
        other_user: conv.other_user,
    }))
}

export function useChat(): UseChatReturn {
    const queryClient = useQueryClient()
    const isMountedRef = useRef(false)

    const {
        data: conversations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
        queryFn: fetchChatConversations,
        staleTime: QUERY_PRESETS.realtime.staleTime,
        gcTime: QUERY_PRESETS.realtime.gcTime,
        retry: 1,
    })

    const selectConversation = useCallback(
        (id: string) => {
            const { useRouter } = require("next/navigation")
            const router = useRouter()
            const conv = conversations.find((c) => c.id === id)
            if (conv) {
                router.push(`/messages/${id}`)
            }
        },
        [conversations]
    )

    const refreshConversations = useCallback(async () => {
        await refetch()
    }, [refetch])

    useEffect(() => {
        isMountedRef.current = true
        const supabase = createClient()
        const channel = supabase
            .channel("chat-conversations")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "conversations",
                },
                () => {
                    if (isMountedRef.current) {
                        queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY })
                    }
                }
            )
            .subscribe()

        return () => {
            isMountedRef.current = false
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
