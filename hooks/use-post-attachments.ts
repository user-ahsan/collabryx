"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  uploadAttachments,
  deleteAttachment,
  getPostAttachments,
  validateAttachmentFile
} from "@/lib/services/post-attachments"
import type { PostAttachment } from "@/types/database.types"

// ===========================================
// HOOK: usePostAttachmentUpload
// ===========================================

interface UsePostAttachmentUploadOptions {
  postId?: string
  onUploadComplete?: (attachment: PostAttachment) => void
  onUploadError?: (error: Error) => void
  multiple?: boolean
}

export function usePostAttachmentUpload(options: UsePostAttachmentUploadOptions = {}) {
  const { postId, onUploadComplete, onUploadError, multiple = true } = options
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File
    preview: string
    attachment?: PostAttachment
  }>>([])
  
  const queryClient = useQueryClient()
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!postId) {
        throw new Error("Post ID is required for upload")
      }
      
      if (!multiple && files.length > 1) {
        throw new Error("Only one file can be uploaded at a time")
      }
      
      const result = await uploadAttachments(files, postId, (completed, total, fileName) => {
        toast.loading(`Uploading ${fileName}... (${completed}/${total})`)
      })
      
      return result
    },
    onSuccess: ({ data, errors }) => {
      data.forEach((attachment) => {
        setUploadedFiles(prev => prev.map(item => 
          item.file.name === attachment.file_name
            ? { ...item, attachment }
            : item
        ))
        onUploadComplete?.(attachment)
      })
      
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
      } else {
        toast.success(`${data.length} attachment${data.length > 1 ? 's' : ''} uploaded successfully`)
      }
      
      // Invalidate attachments query
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ["post-attachments", postId] })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
      onUploadError?.(error)
    }
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await deleteAttachment(attachmentId)
      if (result.error) throw result.error
    },
    onSuccess: () => {
      toast.success("Attachment deleted")
      
      // Remove from uploaded files
      setUploadedFiles(prev => prev.filter(
        item => item.attachment?.id !== uploadMutation.variables
      ))
      
      // Invalidate attachments query
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ["post-attachments", postId] })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
  
  // Handle file selection
  const handleFileSelect = useCallback((files: File[]) => {
    // Validate files
    const validFiles: File[] = []
    const invalidFiles: string[] = []
    
    files.forEach(file => {
      const validation = validateAttachmentFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      }
    })
    
    // Show errors for invalid files
    invalidFiles.forEach(error => toast.error(error))
    
    // Create previews for valid files
    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      
      setUploadedFiles(prev => [...prev, ...newFiles])
      
      // Upload if postId is available
      if (postId) {
        uploadMutation.mutate(validFiles)
      }
    }
    
    return validFiles.length
  }, [postId, uploadMutation])
  
  // Remove file from pending uploads (before posting)
  const removePendingFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index]
      if (file && !file.attachment) {
        // Revoke preview URL to prevent memory leaks
        URL.revokeObjectURL(file.preview)
      }
      
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])
  
  // Remove uploaded attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    deleteMutation.mutate(attachmentId)
  }, [deleteMutation])
  
  // Clear all pending files
  const clearPendingFiles = useCallback(() => {
    setUploadedFiles(prev => {
      // Revoke preview URLs
      prev.forEach(file => {
        if (!file.attachment) {
          URL.revokeObjectURL(file.preview)
        }
      })
      return []
    })
  }, [])
  
  return {
    // State
    uploadedFiles,
    pendingFiles: uploadedFiles.filter(f => !f.attachment),
    attachments: uploadedFiles.filter(f => f.attachment).map(f => f.attachment!),
    
    // Actions
    handleFileSelect,
    removePendingFile,
    removeAttachment,
    clearPendingFiles,
    
    // Mutation states
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    uploadProgress: uploadMutation.isPending ? "uploading" : "idle",
    
    // Mutations
    upload: uploadMutation.mutate,
    delete: deleteMutation.mutate,
    
    // Query states
    isSuccess: uploadMutation.isSuccess,
    isError: uploadMutation.isError || deleteMutation.isError,
    error: uploadMutation.error || deleteMutation.error,
    reset: () => {
      uploadMutation.reset()
      deleteMutation.reset()
    }
  }
}

// ===========================================
// HOOK: usePostAttachments
// ===========================================

export function usePostAttachments(postId: string | undefined) {
  const {
    data: attachments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["post-attachments", postId],
    queryFn: async () => {
      if (!postId) return []
      const result = await getPostAttachments(postId)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
  
  return {
    attachments: attachments || [],
    isLoading,
    error,
    refetch
  }
}

// ===========================================
// HOOK: useAttachmentUpload (for pre-post uploads)
// ===========================================

interface UseAttachmentUploadPrePostOptions {
  onFilesChange?: (files: File[]) => void
}

export function useAttachmentUploadPrePost(options: UseAttachmentUploadPrePostOptions = {}) {
  const { onFilesChange } = options
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  
  const handleFileSelect = useCallback((newFiles: File[]) => {
    const validFiles: File[] = []
    const newErrors: string[] = []
    
    newFiles.forEach(file => {
      const validation = validateAttachmentFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        newErrors.push(`${file.name}: ${validation.error}`)
      }
    })
    
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors])
      newErrors.forEach(error => toast.error(error))
    }
    
    if (validFiles.length > 0) {
      // Create previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      
      setFiles(prev => [...prev, ...validFiles])
      setPreviews(prev => [...prev, ...newPreviews])
      onFilesChange?.([...files, ...validFiles])
    }
  }, [files, onFilesChange])
  
  const removeFile = useCallback((index: number) => {
    // Revoke preview URL
    URL.revokeObjectURL(previews[index])
    
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
    onFilesChange?.(files.filter((_, i) => i !== index))
  }, [previews, files, onFilesChange])
  
  const clearFiles = useCallback(() => {
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles([])
    setPreviews([])
    setErrors([])
    onFilesChange?.([])
  }, [previews, onFilesChange])
  
  return {
    files,
    previews,
    errors,
    handleFileSelect,
    removeFile,
    clearFiles
  }
}
