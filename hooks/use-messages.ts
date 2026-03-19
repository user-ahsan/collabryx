"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    text: string
    is_read: boolean
    read_at?: string | null
    attachment_url?: string
    attachment_type?: "image" | "file"
    created_at: string
}

interface UseMessagesReturn {
    messages: Message[]
    isLoading: boolean
    error: string | null
    sendMessage: (conversationId: string, text: string) => Promise<boolean>
    markAsRead: (conversationId: string) => Promise<void>
    refreshMessages: () => Promise<void>
}

export function useMessages(conversationId?: string, currentUserId?: string): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const isMountedRef = useRef(false)

    const fetchMessages = useCallback(async () => {
        if (!conversationId) {
            setMessages([])
            setIsLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { data, error: fetchError } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true })
                .limit(50)

            if (fetchError) throw fetchError
            if (isMountedRef.current) {
                setMessages(data || [])
                setError(null)
            }
        } catch (err) {
            console.error("Error fetching messages:", err)
            if (isMountedRef.current) {
                setError("Failed to load messages")
                toast.error("Failed to load messages")
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false)
            }
        }
    }, [conversationId])

    useEffect(() => {
        isMountedRef.current = true
        fetchMessages()

        if (!conversationId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    if (isMountedRef.current) {
                        const newMessage = payload.new as Message
                        setMessages(prev => [...prev, newMessage])
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    if (isMountedRef.current) {
                        const updatedMessage = payload.new as Message
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === updatedMessage.id ? updatedMessage : msg
                            )
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            isMountedRef.current = false
            supabase.removeChannel(channel)
        }
    }, [conversationId, fetchMessages])

    const sendMessage = useCallback(async (convId: string, text: string): Promise<boolean> => {
        if (!text.trim()) return false

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("Not authenticated")
                return false
            }

            const { error: sendError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: convId,
                    sender_id: user.id,
                    text: text.trim(),
                    is_read: false
                })

            if (sendError) throw sendError

            await supabase
                .from("conversations")
                .update({
                    last_message_text: text.trim(),
                    last_message_at: new Date().toISOString()
                })
                .eq("id", convId)

            return true
        } catch (err) {
            console.error("Error sending message:", err)
            toast.error("Failed to send message")
            return false
        }
    }, [])

    const markAsRead = useCallback(async (convId: string) => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: conversation } = await supabase
                .from("conversations")
                .select("participant_1, participant_2")
                .eq("id", convId)
                .single()

            if (!conversation) return

            const isParticipant1 = conversation.participant_1 === user.id

            await supabase
                .from("conversations")
                .update({ 
                    [isParticipant1 ? "unread_count_1" : "unread_count_2"]: 0 
                })
                .eq("id", convId)

            const { error: updateError } = await supabase
                .from("messages")
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq("conversation_id", convId)
                .eq("is_read", false)
                .neq("sender_id", user.id)
                .select()

            if (!updateError && updateError === null) {
                // Broadcast read receipt event via realtime
                supabase.channel(`read:${convId}`).send({
                    type: "broadcast",
                    event: "read_receipt",
                    payload: {
                        conversation_id: convId,
                        user_id: user.id,
                        read_at: new Date().toISOString()
                    }
                })
            }
        } catch (err) {
            console.error("Error marking messages as read:", err)
        }
    }, [])

    const refreshMessages = useCallback(async () => {
        await fetchMessages()
    }, [fetchMessages])

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        markAsRead,
        refreshMessages
    }
}
