"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
    error: string | null
    selectedConversation: Conversation | null
    selectConversation: (id: string) => void
    refreshConversations: () => Promise<void>
}

export function useChat(): UseChatReturn {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const isMountedRef = useRef(false)
    const router = useRouter()

    const fetchConversations = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                if (isMountedRef.current) {
                    setError("Not authenticated")
                }
                return
            }

            const { data, error: fetchError } = await supabase
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

            if (fetchError) throw fetchError

            const mapped = (data || []).map((conv) => ({
                ...conv,
                other_user: conv.other_user
            }))

            if (isMountedRef.current) {
                setConversations(mapped)
                setError(null)
            }
        } catch (err) {
            console.error("Error fetching conversations:", err)
            if (isMountedRef.current) {
                setError("Failed to load conversations")
                toast.error("Failed to load conversations")
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        isMountedRef.current = true
        fetchConversations()

        const supabase = createClient()
        const channel = supabase
            .channel("conversations")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "conversations"
                },
                () => {
                    if (isMountedRef.current) {
                        fetchConversations()
                    }
                }
            )
            .subscribe()

        return () => {
            isMountedRef.current = false
            supabase.removeChannel(channel)
        }
    }, [fetchConversations])

    const selectConversation = useCallback((id: string) => {
        const conv = conversations.find(c => c.id === id)
        if (conv) {
            setSelectedConversation(conv)
            router.push(`/messages/${id}`)
        }
    }, [conversations, router])

    const refreshConversations = useCallback(async () => {
        await fetchConversations()
    }, [fetchConversations])

    return {
        conversations,
        isLoading,
        error,
        selectedConversation,
        selectConversation,
        refreshConversations
    }
}
