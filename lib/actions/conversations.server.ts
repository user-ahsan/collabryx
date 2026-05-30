"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logger } from "@/lib/logger"

// ===========================================
// CONVERSATIONS SERVER ACTIONS
// ===========================================

const StartConversationSchema = z.object({
  participant_id: z.string().uuid("Invalid participant ID"),
})

const ArchiveConversationSchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation ID"),
})

// ===========================================
// START CONVERSATION
// ===========================================
export async function startConversationAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const validated = StartConversationSchema.safeParse({
    participant_id: formData.get("participant_id"),
  })

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.issues }
  }

  const { participant_id } = validated.data

  // Prevent starting a conversation with yourself
  if (participant_id === user.id) {
    return { error: "Cannot start a conversation with yourself" }
  }

  // Verify the other participant exists
  const { data: otherProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", participant_id)
    .single()

  if (profileError || !otherProfile) {
    return { error: "Participant not found" }
  }

  // Enforce lexicographic ordering for CHECK constraint
  const [p1, p2] = user.id < participant_id
    ? [user.id, participant_id]
    : [participant_id, user.id]

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, last_message_text, last_message_at, is_archived, created_at")
    .eq("participant_1", p1)
    .eq("participant_2", p2)
    .single()

  if (existing) {
    // Unarchive if it was archived
    if (existing.is_archived) {
      await supabase
        .from("conversations")
        .update({ is_archived: false })
        .eq("id", existing.id)
    }

    revalidatePath("/messages")
    return { data: existing }
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      participant_1: p1,
      participant_2: p2,
    })
    .select("id, participant_1, participant_2, last_message_text, last_message_at, created_at")
    .single()

  if (error) {
    // Handle race condition: conversation may have been created between check and insert
    if (error.code === "23505") {
      const { data: retryExisting } = await supabase
        .from("conversations")
        .select("id, participant_1, participant_2, last_message_text, last_message_at, created_at")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .single()

      if (retryExisting) {
        revalidatePath("/messages")
        return { data: retryExisting }
      }
    }

    logger.db.error("Failed to create conversation", error)
    return { error: "Failed to start conversation" }
  }

  revalidatePath("/messages")

  return { data: conversation }
}

// ===========================================
// ARCHIVE CONVERSATION
// ===========================================
export async function archiveConversationAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const validated = ArchiveConversationSchema.safeParse({
    conversation_id: formData.get("conversation_id"),
  })

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.issues }
  }

  const { conversation_id } = validated.data

  // Verify user is a participant
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2")
    .eq("id", conversation_id)
    .single()

  if (convError || !conversation) {
    return { error: "Conversation not found" }
  }

  if (
    conversation.participant_1 !== user.id &&
    conversation.participant_2 !== user.id
  ) {
    return { error: "Not authorized" }
  }

  const { error } = await supabase
    .from("conversations")
    .update({ is_archived: true })
    .eq("id", conversation_id)

  if (error) {
    logger.db.error("Failed to archive conversation", error)
    return { error: "Failed to archive conversation" }
  }

  revalidatePath("/messages")

  return { success: true }
}
