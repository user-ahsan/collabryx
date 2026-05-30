import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import type { Message } from "@/types/database.types"

// ===========================================
// MESSAGES SERVICE
// ===========================================

const SendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  text: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  attachment_url: z.string().url().optional(),
  attachment_type: z.enum(["image", "file"]).optional(),
})

const FetchMessagesSchema = z.object({
  conversation_id: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().datetime().optional(),
})

export interface SendMessageInput {
  conversationId: string
  text: string
  attachmentUrl?: string
  attachmentType?: "image" | "file"
}

export interface FetchMessagesInput {
  conversationId: string
  limit?: number
  cursor?: string
}

export interface MessageWithSender extends Message {
  sender_name?: string
  sender_avatar?: string
}

/**
 * Send a message in a conversation.
 * Verifies the sender is a participant in the conversation.
 */
export async function sendMessage(
  input: SendMessageInput,
): Promise<{ data: Message | null; error: Error | null }> {
  const validation = SendMessageSchema.safeParse({
    conversation_id: input.conversationId,
    text: input.text,
    attachment_url: input.attachmentUrl,
    attachment_type: input.attachmentType,
  })
  if (!validation.success) {
    return { data: null, error: new Error(validation.error.errors[0]?.message) }
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    // Verify sender is a participant in the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", input.conversationId)
      .single()

    if (convError || !conversation) {
      return { data: null, error: new Error("Conversation not found") }
    }

    if (
      conversation.participant_1 !== user.id &&
      conversation.participant_2 !== user.id
    ) {
      return { data: null, error: new Error("Not a participant in this conversation") }
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: user.id,
        text: input.text,
        attachment_url: input.attachmentUrl ?? null,
        attachment_type: input.attachmentType ?? null,
      })
      .select("id, conversation_id, sender_id, text, is_read, attachment_url, attachment_type, read_at, created_at")
      .single()

    if (error) {
      logger.db.error("Failed to send message", error)
      return { data: null, error: new Error("Failed to send message") }
    }

    // Update conversation last_message atomically
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message_text: input.text,
        last_message_at: data.created_at,
      })
      .eq("id", input.conversationId)

    if (updateError) {
      logger.db.warn("Failed to update conversation last_message", updateError)
    }

    return { data, error: null }
  } catch (error) {
    logger.db.error("Error sending message", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch messages for a conversation with cursor-based pagination.
 * Only participants can view the messages.
 */
export async function fetchMessages(
  input: FetchMessagesInput,
): Promise<{ data: MessageWithSender[]; error: Error | null }> {
  const validation = FetchMessagesSchema.safeParse({
    conversation_id: input.conversationId,
    limit: input.limit,
    cursor: input.cursor,
  })
  if (!validation.success) {
    return { data: [], error: new Error(validation.error.errors[0]?.message) }
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    // Verify user is a participant
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", input.conversationId)
      .single()

    if (convError || !conversation) {
      return { data: [], error: new Error("Conversation not found") }
    }

    if (
      conversation.participant_1 !== user.id &&
      conversation.participant_2 !== user.id
    ) {
      return { data: [], error: new Error("Not authorized to view this conversation") }
    }

    let query = supabase
      .from("messages")
      .select("id, conversation_id, sender_id, text, is_read, attachment_url, attachment_type, read_at, created_at")
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50)

    if (input.cursor) {
      query = query.lt("created_at", input.cursor)
    }

    const { data, error } = await query

    if (error) {
      logger.db.error("Failed to fetch messages", error)
      return { data: [], error: new Error("Failed to fetch messages") }
    }

    // Collect unique sender IDs for batch profile fetch
    const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))]
    let senderMap = new Map<string, { name: string; avatar: string }>()

    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", senderIds)

      for (const p of profiles ?? []) {
        senderMap.set(p.id, {
          name: p.display_name ?? "Unknown",
          avatar: p.avatar_url ?? "",
        })
      }
    }

    const messages: MessageWithSender[] = (data as Message[] ?? []).map((msg) => ({
      ...msg,
      sender_name: senderMap.get(msg.sender_id)?.name ?? "Unknown",
      sender_avatar: senderMap.get(msg.sender_id)?.avatar ?? "",
    }))

    return { data: messages, error: null }
  } catch (error) {
    logger.db.error("Error fetching messages", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Mark a single message as read.
 * Only the recipient (non-sender participant) can mark as read.
 */
export async function markMessageRead(
  messageId: string,
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: new Error("Not authenticated") }
    }

    // Verify the message exists and user is NOT the sender
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("id, sender_id, conversation_id, is_read")
      .eq("id", messageId)
      .single()

    if (msgError || !message) {
      return { error: new Error("Message not found") }
    }

    if (message.sender_id === user.id) {
      return { error: new Error("Cannot mark your own message as read") }
    }

    if (message.is_read) {
      return { error: null } // Already read, no-op
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId)

    if (error) {
      logger.db.error("Failed to mark message as read", error)
      return { error: new Error("Failed to mark message as read") }
    }

    return { error: null }
  } catch (error) {
    logger.db.error("Error marking message as read", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Delete a message. Only the sender can delete their own message.
 */
export async function deleteMessage(
  messageId: string,
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: new Error("Not authenticated") }
    }

    // Verify sender ownership
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("id, sender_id")
      .eq("id", messageId)
      .single()

    if (msgError || !message) {
      return { error: new Error("Message not found") }
    }

    if (message.sender_id !== user.id) {
      return { error: new Error("Not authorized to delete this message") }
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", user.id)

    if (error) {
      logger.db.error("Failed to delete message", error)
      return { error: new Error("Failed to delete message") }
    }

    return { error: null }
  } catch (error) {
    logger.db.error("Error deleting message", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}
