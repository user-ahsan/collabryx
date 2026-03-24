import { createClient } from "@/lib/supabase/client"
import type { PostAttachment } from "@/types/database.types"
import {
  validatePostAttachment,
  getPostAttachmentType,
  sanitizePostAttachmentFileName,
  generatePostAttachmentFileName
} from "@/lib/validations/post-attachments"

// ===========================================
// POST ATTACHMENTS SERVICE
// ===========================================

export interface UploadAttachmentInput {
  file: File
  postId: string
  orderIndex?: number
}

export interface UploadAttachmentResult {
  data: PostAttachment | null
  error: Error | null
}

/**
 * Upload a file to Supabase storage and create attachment record
 */
export async function uploadAttachment(
  input: UploadAttachmentInput
): Promise<UploadAttachmentResult> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }
    
    if (!user) {
      return { data: null, error: new Error("Please log in to upload attachments.") }
    }
    
    // Validate file
    const validation = validatePostAttachment(input.file)
    if (!validation.valid) {
      return { data: null, error: new Error(validation.error) }
    }
    
    // Verify user owns the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", input.postId)
      .single()
    
    if (postError || !post) {
      return { data: null, error: new Error("Post not found") }
    }
    
    if (post.author_id !== user.id) {
      return { data: null, error: new Error("Not authorized to add attachments to this post") }
    }
    
    // Generate unique file name
    const sanitizedFileName = sanitizePostAttachmentFileName(input.file.name)
    const storageFileName = generatePostAttachmentFileName(input.file.name, user.id)
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(`posts/${input.postId}/${storageFileName}`, input.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: input.file.type
      })
    
    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { data: null, error: new Error(`Upload failed: ${uploadError.message}`) }
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("post-media")
      .getPublicUrl(`posts/${input.postId}/${storageFileName}`)
    
    const fileUrl = urlData.publicUrl
    
    // Create database record
    const { data: attachment, error: dbError } = await supabase
      .from("post_attachments")
      .insert({
        post_id: input.postId,
        file_url: fileUrl,
        file_type: getPostAttachmentType(input.file.type),
        file_name: sanitizedFileName,
        file_size: input.file.size,
        mime_type: input.file.type,
        order_index: input.orderIndex ?? 0
      })
      .select()
      .single()
    
    if (dbError) {
      console.error("Database error:", dbError)
      // Try to clean up the uploaded file
      await supabase.storage
        .from("post-media")
        .remove([`posts/${input.postId}/${storageFileName}`])
      
      return { data: null, error: new Error(`Failed to save attachment: ${dbError.message}`) }
    }
    
    return { data: attachment, error: null }
  } catch {
    console.error("Unexpected error uploading attachment:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Failed to upload attachment") 
    }
  }
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadAttachments(
  files: File[],
  postId: string,
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<{ data: PostAttachment[]; errors: string[] }> {
  const results: PostAttachment[] = []
  const errors: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadAttachment({
      file,
      postId,
      orderIndex: i
    })
    
    if (result.data) {
      results.push(result.data)
    }
    
    if (result.error) {
      errors.push(`${file.name}: ${result.error.message}`)
    }
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name)
    }
  }
  
  return { data: results, errors }
}

/**
 * Delete an attachment (file + database record)
 */
export async function deleteAttachment(
  attachmentId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }
    
    if (!user) {
      return { error: new Error("Please log in to delete attachments.") }
    }
    
    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from("post_attachments")
      .select("post_id, file_url")
      .eq("id", attachmentId)
      .single()
    
    if (fetchError || !attachment) {
      return { error: new Error("Attachment not found") }
    }
    
    // Verify user owns the post
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", attachment.post_id)
      .single()
    
    if (!post || post.author_id !== user.id) {
      return { error: new Error("Not authorized to delete this attachment") }
    }
    
    // Extract file path from URL
    const urlParts = attachment.file_url.split("/storage/v1/object/public/post-media/")
    const filePath = urlParts.length > 1 ? urlParts[1] : null
    
    // Delete from storage if we have the path
    if (filePath) {
      await supabase.storage
        .from("post-media")
        .remove([filePath])
    }
    
    // Delete database record
    const { error: deleteError } = await supabase
      .from("post_attachments")
      .delete()
      .eq("id", attachmentId)
    
    if (deleteError) {
      return { error: new Error(`Failed to delete attachment: ${deleteError.message}`) }
    }
    
    return { error: null }
  } catch {
    console.error("Error deleting attachment:", error)
    return { error: error instanceof Error ? error : new Error("Failed to delete attachment") }
  }
}

/**
 * Get attachments for a post
 */
export async function getPostAttachments(
  postId: string
): Promise<{ data: PostAttachment[]; error: Error | null }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("post_attachments")
      .select("*")
      .eq("post_id", postId)
      .order("order_index", { ascending: true })
    
    if (error) {
      return { data: [], error: new Error(`Failed to fetch attachments: ${error.message}`) }
    }
    
    return { data: data as PostAttachment[], error: null }
  } catch {
    console.error("Error fetching attachments:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("Failed to fetch attachments") 
    }
  }
}

/**
 * Delete multiple attachments
 */
export async function deleteAttachments(
  attachmentIds: string[]
): Promise<{ success: number; errors: string[] }> {
  let success = 0
  const errors: string[] = []
  
  for (const attachmentId of attachmentIds) {
    const result = await deleteAttachment(attachmentId)
    if (result.error) {
      errors.push(result.error.message)
    } else {
      success++
    }
  }
  
  return { success, errors }
}

/**
 * Validate file before upload (client-side)
 */
export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  const validation = validatePostAttachment(file)
  
  if (!validation.valid) {
    return { valid: false, error: validation.error }
  }
  
  return { valid: true }
}
