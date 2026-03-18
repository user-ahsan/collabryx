import { z } from "zod"

// ===========================================
// POST ATTACHMENTS VALIDATION SCHEMAS
// ===========================================

export const ALLOWED_POST_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime"
] as const

export const POST_ATTACHMENT_SIZE_LIMITS = {
  IMAGE: 50 * 1024 * 1024, // 50MB for images
  VIDEO: 50 * 1024 * 1024  // 50MB for videos
} as const

// ===========================================
// ATTACHMENT VALIDATION SCHEMA
// ===========================================

export const postAttachmentSchema = z.object({
  file_name: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name is too long")
    .refine(
      (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
      "Invalid file name"
    ),
  file_type: z.enum(["image", "video"], {
    errorMap: () => ({ message: "File type must be image or video" })
  }),
  file_size: z
    .number()
    .min(1, "File size must be greater than 0")
    .max(POST_ATTACHMENT_SIZE_LIMITS.IMAGE, "File size exceeds 50MB limit"),
  mime_type: z.string().min(1, "MIME type is required"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
})

export type PostAttachmentInput = z.infer<typeof postAttachmentSchema>

// ===========================================
// UPLOAD VALIDATION SCHEMA
// ===========================================

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(POST_ATTACHMENT_SIZE_LIMITS.IMAGE),
  fileType: z.string().min(1),
  postId: z.string().uuid("Invalid post ID")
})

export type UploadRequest = z.infer<typeof uploadRequestSchema>

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate post attachment file
 */
export function validatePostAttachment(
  file: { name: string; type: string; size: number }
): { valid: true } | { valid: false; error: string } {
  // Check MIME type
  const isAllowedType = ALLOWED_POST_ATTACHMENT_TYPES.includes(file.type as typeof ALLOWED_POST_ATTACHMENT_TYPES[number])
  if (!isAllowedType) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)`
    }
  }

  // Check file size (50MB for both images and videos in posts)
  const maxSize = POST_ATTACHMENT_SIZE_LIMITS.IMAGE
  if (file.size > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(0)
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxMB}MB`
    }
  }

  // Check file name
  if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
    return {
      valid: false,
      error: "Invalid file name"
    }
  }

  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*]/g
  if (dangerousChars.test(file.name)) {
    return {
      valid: false,
      error: "File name contains invalid characters"
    }
  }

  return { valid: true }
}

/**
 * Get file type category for post attachments
 */
export function getPostAttachmentType(mimeType: string): "image" | "video" {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  return "image" // Default to image
}

/**
 * Sanitize file name for storage
 */
export function sanitizePostAttachmentFileName(fileName: string): string {
  // Remove path components
  const baseName = fileName.split(/[\\/]/).pop() || fileName
  
  // Remove special characters, keep alphanumeric, dash, underscore, dot
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_")
  
  // Limit length
  return sanitizedName.slice(0, 255)
}

/**
 * Generate unique file name for storage
 */
export function generatePostAttachmentFileName(originalName: string, userId: string): string {
  const extension = originalName.split(".").pop() || ""
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const sanitizedBase = sanitizePostAttachmentFileName(originalName.replace(/\.[^/.]+$/, ""))
  
  // Format: userId_timestamp_random_sanitizedName.extension
  return `${userId}_${timestamp}_${random}_${sanitizedBase}.${extension}`
}
