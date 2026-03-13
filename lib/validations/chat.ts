import { z } from "zod"

// ===========================================
// CHAT & MESSAGING VALIDATION SCHEMAS
// ===========================================

export const messageSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be less than 2000 characters."),
  attachment_url: z.string().url().optional().or(z.literal("")),
  attachment_type: z.enum(["image", "file"]).optional().or(z.null()),
})

export const conversationSchema = z.object({
  participant_ids: z
    .array(z.string().uuid())
    .length(2, "Conversation must have exactly 2 participants."),
})

export const chatInputSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be less than 2000 characters."),
  conversation_id: z.string().uuid().optional(),
  context: z
    .object({
      page: z.string().optional(),
      user_action: z.string().optional(),
    })
    .optional(),
})

// ===========================================
// TYPE EXPORTS
// ===========================================

export type MessageData = z.infer<typeof messageSchema>
export type ConversationData = z.infer<typeof conversationSchema>
export type ChatInputData = z.infer<typeof chatInputSchema>

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Validates message data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateMessage(
  rawData: unknown
): { success: true; data: MessageData } | { success: false; errors: string[] } {
  const result = messageSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      const path = err.path.join(".")
      const message = err.message
      return path ? `${path}: ${message}` : message
    })
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

/**
 * Validates chat input data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateChatInput(
  rawData: unknown
): { success: true; data: ChatInputData } | { success: false; errors: string[] } {
  const result = chatInputSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}
