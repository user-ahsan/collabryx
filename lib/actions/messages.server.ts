"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logger } from "@/lib/logger"

// ===========================================
// MESSAGES SERVER ACTIONS
// ===========================================

const SendMessageActionSchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation ID"),
  text: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  attachment_url: z.string().url().optional(),
  attachment_type: z.enum(["image", "file"]).optional(),
})

const MarkReadSchema = z.object({
  message_id: z.string().uuid("Invalid message ID"),
})

const DeleteMessageSchema = z.object({
  message_id: z.string().uuid("Invalid message ID"),
})

// ===========================================
// SEND MESSAGE
// ===========================================
export async function sendMessageAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const validated = SendMessageActionSchema.safeParse({
    conversation_id: formData.get("conversation_id"),
    text: formData.get("text"),
    attachment_url: formData.get("attachment_url") || undefined,
    attachment_type: formData.get("attachment_type") || undefined,
  })

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.issues }
  }

  const { conversation_id, text, attachment_url, attachment_type } = validated.data

  // Verify user is a participant in the conversation
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

  // Insert the message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      text,
      attachment_url: attachment_url ?? null,
      attachment_type: attachment_type ?? null,
    })
    .select("id, conversation_id, sender_id, text, is_read, attachment_url, attachment_type, created_at")
    .single()

  if (error) {
    logger.db.error("Failed to send message", error)
    return { error: "Failed to send message" }
  }

  // Update conversation last_message atomically
  await supabase
    .from("conversations")
    .update({
      last_message_text: text,
      last_message_at: message.created_at,
    })
    .eq("id", conversation_id)

  revalidatePath(`/messages/${conversation_id}`)
  revalidatePath("/messages")

  return { data: message }
}

// ===========================================
// MARK MESSAGE AS READ
// ===========================================
export async function markMessageReadAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const validated = MarkReadSchema.safeParse({
    message_id: formData.get("message_id"),
  })

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.issues }
  }

  const { message_id } = validated.data

  // Verify the message exists and user is NOT the sender
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, sender_id, conversation_id, is_read")
    .eq("id", message_id)
    .single()

  if (msgError || !message) {
    return { error: "Message not found" }
  }

  if (message.sender_id === user.id) {
    return { error: "Cannot mark own message as read" }
  }

  if (message.is_read) {
    return { success: true } // Already read
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", message_id)

  if (error) {
    logger.db.error("Failed to mark message as read", error)
    return { error: "Failed to mark message as read" }
  }

  revalidatePath(`/messages/${message.conversation_id}`)
  revalidatePath("/messages")

  return { success: true }
}

// ===========================================
// DELETE MESSAGE
// ===========================================
export async function deleteMessageAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const validated = DeleteMessageSchema.safeParse({
    message_id: formData.get("message_id"),
  })

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.issues }
  }

  const { message_id } = validated.data

  // Verify sender ownership
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, sender_id, conversation_id")
    .eq("id", message_id)
    .single()

  if (msgError || !message) {
    return { error: "Message not found" }
  }

  if (message.sender_id !== user.id) {
    return { error: "Not authorized to delete this message" }
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", message_id)
    .eq("sender_id", user.id)

  if (error) {
    logger.db.error("Failed to delete message", error)
    return { error: "Failed to delete message" }
  }

  revalidatePath(`/messages/${message.conversation_id}`)
  revalidatePath("/messages")

  return { success: true }
}
