"use client"

import { useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { QUERY_PRESETS } from "@/lib/query-cache"
import type { Message } from "@/types/database.types"

export const MESSAGE_QUERY_KEYS = {
  all: ["messages"] as const,
  conversation: (conversationId?: string) => [...MESSAGE_QUERY_KEYS.all, "conversation", conversationId ?? "all"] as const,
} as const

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  error: Error | null
  sendMessage: (conversationId: string, text: string) => Promise<boolean>
  markAsRead: (conversationId: string) => Promise<void>
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) throw error
  return data || []
}

async function sendMessageMutation({ conversationId, text }: { conversationId: string; text: string }): Promise<Message> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const { data, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: text.trim(),
      is_read: false,
    })
    .select()
    .single()

  if (insertError) throw insertError

  await supabase
    .from("conversations")
    .update({
      last_message_text: text.trim(),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return data
}

async function markAsReadMutation(conversationId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return

  const { data: conversation } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single()

  if (!conversation) return

  const isParticipant1 = conversation.participant_1 === user.id

  await supabase
    .from("conversations")
    .update({
      [isParticipant1 ? "unread_count_1" : "unread_count_2"]: 0,
    })
    .eq("id", conversationId)

  await supabase
    .from("messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", user.id)

  supabase.channel(`read:${conversationId}`).send({
    type: "broadcast",
    event: "read_receipt",
    payload: {
      conversation_id: conversationId,
      user_id: user.id,
      read_at: new Date().toISOString(),
    },
  })
}

export function useMessages(conversationId?: string, currentUserId?: string): UseMessagesReturn {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversation(conversationId),
    queryFn: () => conversationId ? fetchMessages(conversationId) : Promise.resolve([]),
    enabled: !!conversationId,
    ...QUERY_PRESETS.realtime,
  })

  const sendMessageMutationHook = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMessageMutation({ conversationId, text }),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        MESSAGE_QUERY_KEYS.conversation(newMessage.conversation_id),
        (old: Message[] = []) => [...old, newMessage]
      )
      toast.success("Message sent")
    },
    onError: (error) => {
      toast.error("Failed to send message")
      console.error("Error sending message:", error)
    },
  })

  const markAsReadMutationHook = useMutation({
    mutationFn: markAsReadMutation,
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversation(conversationId),
      })
    },
    onError: (error) => {
      console.error("Error marking messages as read:", error)
    },
  })

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    channelRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          queryClient.setQueryData(
            MESSAGE_QUERY_KEYS.conversation(conversationId),
            (old: Message[] = []) => {
              if (old.some((m) => m.id === newMessage.id)) return old
              return [...old, newMessage]
            }
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          queryClient.setQueryData(
            MESSAGE_QUERY_KEYS.conversation(conversationId),
            (old: Message[] = []) =>
              old.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          )
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [conversationId, queryClient])

  const sendMessage = useCallback(
    async (convId: string, text: string): Promise<boolean> => {
      if (!text.trim()) return false
      try {
        await sendMessageMutationHook.mutateAsync({ conversationId: convId, text })
        return true
      } catch {
        return false
      }
    },
    [sendMessageMutationHook]
  )

  const markAsRead = useCallback(
    async (convId: string) => {
      await markAsReadMutationHook.mutateAsync(convId)
    },
    [markAsReadMutationHook]
  )

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
  }
}
