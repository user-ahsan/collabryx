"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseTypingIndicatorReturn {
    isTyping: boolean
    sendTypingEvent: (conversationId: string) => void
    clearTypingStatus: () => void
}

interface TypingPayload {
    user_id: string
    is_typing: boolean
}

const TYPING_TIMEOUT = 2000 // Clear typing status after 2 seconds
const TYPING_DEBOUNCE = 500 // Debounce typing events by 500ms

/**
 * Hook for managing typing indicators in chat conversations
 * 
 * @param conversationId - The ID of the conversation to monitor
 * @param userId - The ID of the current user
 * @returns Object with typing state and control functions
 * 
 * @example
 * ```typescript
 * const { isTyping, sendTypingEvent, clearTypingStatus } = useTypingIndicator(convId, userId)
 * ```
 */
export function useTypingIndicator(conversationId?: string, userId?: string): UseTypingIndicatorReturn {
    const [isTyping, setIsTyping] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const lastTypingSentRef = useRef<number>(0)
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Subscribe to typing events from other users
    useEffect(() => {
        if (!conversationId || !userId) return

        const supabase = createClient()
        const channel = supabase.channel(`typing:${conversationId}`)
        channelRef.current = channel
        
        channel.on("broadcast", { event: "typing" }, (payload: { payload: unknown }) => {
            const typingPayload = payload.payload as TypingPayload
            const { user_id, is_typing } = typingPayload
            // Only show typing indicator if it's from the other user
            if (user_id !== userId && is_typing) {
                setIsTyping(true)
                // Auto-hide after timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current)
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false)
                }, TYPING_TIMEOUT)
            }
        })
        
        channel.subscribe()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [conversationId, userId])

    // Send typing event with debounce
    const sendTypingEvent = useCallback((convId: string) => {
        if (!userId) return

        const now = Date.now()
        // Don't send if we sent one recently (debounce)
        if (now - lastTypingSentRef.current < TYPING_DEBOUNCE) {
            return
        }
        lastTypingSentRef.current = now

        const supabase = createClient()
        supabase.channel(`typing:${convId}`).send({
            type: "broadcast",
            event: "typing",
            payload: {
                conversation_id: convId,
                user_id: userId,
                is_typing: true
            }
        })
    }, [userId])

    // Clear typing status (when user stops typing)
    const clearTypingStatus = useCallback(() => {
        if (!conversationId || !userId) return

        const supabase = createClient()
        supabase.channel(`typing:${conversationId}`).send({
            type: "broadcast",
            event: "typing",
            payload: {
                conversation_id: conversationId,
                user_id: userId,
                is_typing: false
            }
        })

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
    }, [conversationId, userId])

    return {
        isTyping,
        sendTypingEvent,
        clearTypingStatus
    }
}
