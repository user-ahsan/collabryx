import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import type { Conversation, Message } from "@/types/database.types"

// ===========================================
// CONVERSATIONS SERVICE
// ===========================================

const CreateConversationSchema = z.object({
  participant_1: z.string().uuid(),
  participant_2: z.string().uuid(),
}).refine((data) => data.participant_1 < data.participant_2, {
  message: "participant_1 must be lexicographically less than participant_2",
})

export interface ConversationWithParticipantInfo extends Conversation {
  other_user_id: string
  other_user_name?: string
  other_user_avatar?: string
  last_message?: Pick<Message, "id" | "text" | "created_at" | "sender_id">
}

/**
 * Create or get an existing conversation between two users.
 * Enforces the CHECK constraint (participant_1 < participant_2).
 */
export async function createOrGetConversation(
  userId1: string,
  userId2: string,
): Promise<{ data: Conversation | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    // Caller must be one of the participants
    if (user.id !== userId1 && user.id !== userId2) {
      return { data: null, error: new Error("Not authorized to create this conversation") }
    }

    const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]

    // Try to find existing conversation
    const { data: existing, error: fetchError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2, is_archived, created_at")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .single()

    if (!fetchError && existing) {
      return { data: existing, error: null }
    }

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.db.error("Failed to fetch conversation", fetchError)
      return { data: null, error: new Error("Failed to check for existing conversation") }
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant_1: p1,
        participant_2: p2,
      })
      .select("id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2, is_archived, created_at")
      .single()

    if (error) {
      logger.db.error("Failed to create conversation", error)
      return { data: null, error: new Error("Failed to create conversation") }
    }

    return { data, error: null }
  } catch (error) {
    logger.db.error("Error creating conversation", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch all conversations for a user with participant info.
 */
export async function fetchUserConversations(
  userId: string,
): Promise<{ data: ConversationWithParticipantInfo[]; error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    // User can only fetch their own conversations
    if (user.id !== userId) {
      return { data: [], error: new Error("Not authorized") }
    }

    // Fetch conversations where user is participant_1 or participant_2
    const { data: conv1, error: err1 } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2, is_archived, created_at")
      .eq("participant_1", userId)
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (err1) {
      logger.db.error("Failed to fetch conversations as p1", err1)
      return { data: [], error: new Error("Failed to fetch conversations") }
    }

    const { data: conv2, error: err2 } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2, is_archived, created_at")
      .eq("participant_2", userId)
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (err2) {
      logger.db.error("Failed to fetch conversations as p2", err2)
      return { data: [], error: new Error("Failed to fetch conversations") }
    }

    const allConversations = [...(conv1 ?? []), ...(conv2 ?? [])]

    // Sort merged results by last_message_at descending
    allConversations.sort((a, b) => {
      const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return dateB - dateA
    })

    // Collect other participant IDs for batch profile fetch
    const otherUserIds = allConversations.map((c) =>
      c.participant_1 === userId ? c.participant_2 : c.participant_1
    )
    const uniqueIds = [...new Set(otherUserIds)]

    let profileMap = new Map<string, { name: string; avatar: string }>()
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", uniqueIds)

      for (const p of profiles ?? []) {
        profileMap.set(p.id, {
          name: p.display_name ?? "Unknown",
          avatar: p.avatar_url ?? "",
        })
      }
    }

    const result: ConversationWithParticipantInfo[] = allConversations.map((c) => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1
      return {
        ...c,
        other_user_id: otherId,
        other_user_name: profileMap.get(otherId)?.name ?? "Unknown",
        other_user_avatar: profileMap.get(otherId)?.avatar ?? "",
      }
    })

    return { data: result, error: null }
  } catch (error) {
    logger.db.error("Error fetching conversations", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch a single conversation by ID. Only participants can view.
 */
export async function fetchConversation(
  conversationId: string,
): Promise<{ data: Conversation | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2, is_archived, created_at")
      .eq("id", conversationId)
      .single()

    if (error) {
      return { data: null, error: new Error("Conversation not found") }
    }

    if (data.participant_1 !== user.id && data.participant_2 !== user.id) {
      return { data: null, error: new Error("Not authorized") }
    }

    return { data, error: null }
  } catch (error) {
    logger.db.error("Error fetching conversation", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Archive a conversation. Only participants can archive.
 */
export async function archiveConversation(
  conversationId: string,
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: new Error("Not authenticated") }
    }

    // Verify user is a participant
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) {
      return { error: new Error("Conversation not found") }
    }

    if (
      conversation.participant_1 !== user.id &&
      conversation.participant_2 !== user.id
    ) {
      return { error: new Error("Not authorized") }
    }

    const { error } = await supabase
      .from("conversations")
      .update({ is_archived: true })
      .eq("id", conversationId)

    if (error) {
      logger.db.error("Failed to archive conversation", error)
      return { error: new Error("Failed to archive conversation") }
    }

    return { error: null }
  } catch (error) {
    logger.db.error("Error archiving conversation", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}
