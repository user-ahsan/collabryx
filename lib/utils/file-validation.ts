import { z } from "zod"

// ===========================================
// FILE UPLOAD VALIDATION SCHEMAS
// ===========================================

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
] as const

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FILE: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024, // 2MB
  BANNER: 5 * 1024 * 1024 // 5MB
} as const

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: readonly string[]
): { valid: true } | { valid: false; error: string } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
    }
  }
  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number,
  fieldName: string = "File"
): { valid: true } | { valid: false; error: string } {
  if (fileSize > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `${fieldName} is too large. Maximum size is ${maxMB}MB`
    }
  }
  return { valid: true }
}

/**
 * Validate file name (prevent path traversal and special characters)
 */
export function validateFileName(fileName: string): { valid: true } | { valid: false; error: string } {
  // Check for path traversal attempts
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return {
      valid: false,
      error: "Invalid file name"
    }
  }
  
  // Check for special characters that could be used in attacks
  const dangerousChars = /[<>:"|?*]/g
  if (dangerousChars.test(fileName)) {
    return {
      valid: false,
      error: "File name contains invalid characters"
    }
  }
  
  // Check length
  if (fileName.length > 255) {
    return {
      valid: false,
      error: "File name is too long"
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  const baseName = fileName.split(/[\\/]/).pop() || fileName
  
  // Remove special characters, keep alphanumeric, dash, underscore, dot
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_")
  
  // Limit length
  return sanitizedName.slice(0, 255)
}

/**
 * Generate secure file name
 */
export function generateSecureFileName(originalName: string): string {
  const extension = originalName.split(".").pop() || ""
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  
  return `${timestamp}_${random}.${extension}`
}

/**
 * Validate image file
 */
export function validateImage(
  file: { name: string; type: string; size: number },
  options: { maxSize?: number; allowAnimated?: boolean } = {}
): { valid: true } | { valid: false; error: string } {
  const maxSize = options.maxSize || FILE_SIZE_LIMITS.IMAGE
  
  // Validate type
  const typeResult = validateFileType(file.type, ALLOWED_IMAGE_TYPES)
  if (!typeResult.valid) return typeResult
  
  // Validate size
  const sizeResult = validateFileSize(file.size, maxSize, "Image")
  if (!sizeResult.valid) return sizeResult
  
  // Validate name
  const nameResult = validateFileName(file.name)
  if (!nameResult.valid) return nameResult
  
  // Check for animated images if not allowed
  if (!options.allowAnimated) {
    if (file.type === "image/gif" || file.type === "image/webp") {
      // Would need to check actual file content for animation
      // This is a basic check
      console.warn("Animated image detected, may not be allowed")
    }
  }
  
  return { valid: true }
}

/**
 * Validate document file
 */
export function validateDocument(
  file: { name: string; type: string; size: number }
): { valid: true } | { valid: false; error: string } {
  // Validate type
  const typeResult = validateFileType(file.type, ALLOWED_FILE_TYPES)
  if (!typeResult.valid) return typeResult
  
  // Validate size
  const sizeResult = validateFileSize(file.size, FILE_SIZE_LIMITS.FILE, "File")
  if (!sizeResult.valid) return sizeResult
  
  // Validate name
  const nameResult = validateFileName(file.name)
  if (!nameResult.valid) return nameResult
  
  return { valid: true }
}

/**
 * Validate avatar upload
 */
export function validateAvatar(
  file: { name: string; type: string; size: number }
): { valid: true } | { valid: false; error: string } {
  return validateImage(file, { maxSize: FILE_SIZE_LIMITS.AVATAR })
}

/**
 * Validate banner upload
 */
export function validateBanner(
  file: { name: string; type: string; size: number }
): { valid: true } | { valid: false; error: string } {
  return validateImage(file, { maxSize: FILE_SIZE_LIMITS.BANNER })
}

/**
 * Get file type category
 */
export function getFileCategory(mimeType: string): "image" | "document" | "video" | "audio" | "other" {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (
    mimeType.startsWith("application/") ||
    mimeType.startsWith("text/")
  ) return "document"
  return "other"
}

/**
 * Create pre-signed URL validation schema
 */
export const uploadValidationSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(FILE_SIZE_LIMITS.FILE),
  fileType: z.string().min(1),
  uploadType: z.enum(["post", "avatar", "banner", "message"])
})

export type UploadValidation = z.infer<typeof uploadValidationSchema>
