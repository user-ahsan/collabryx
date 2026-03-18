"use client"

import { useCallback, useRef, useState } from "react"
import { usePostAttachmentUpload, useAttachmentUploadPrePost } from "@/hooks/use-post-attachments"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import Image from "next/image"

// ===========================================
// POST ATTACHMENT UPLOAD COMPONENT
// ===========================================

interface PostAttachmentUploadProps {
  postId?: string
  onFilesChange?: (files: File[]) => void
  className?: string
  disabled?: boolean
  maxFiles?: number
}

/**
 * PostAttachmentUpload - Drag & drop file upload for post attachments
 * 
 * Features:
 * - Drag & drop support
 * - File picker
 * - Preview thumbnails
 * - Upload progress
 * - Remove attachments
 * - Multi-file support
 * - File validation
 */
export function PostAttachmentUpload({
  postId,
  onFilesChange,
  className,
  disabled = false,
  maxFiles = 10
}: PostAttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Use pre-post upload hook if no postId (files uploaded with post)
  // Use post upload hook if postId exists (files uploaded to existing post)
  const prePostUpload = useAttachmentUploadPrePost({
    onFilesChange: onFilesChange
  })
  
  const postUpload = usePostAttachmentUpload({
    postId,
    multiple: true
  })
  
  // Use appropriate state based on whether we have a postId
  const files = postId ? postUpload.uploadedFiles.map(f => f.file) : prePostUpload.files
  const isUploading = postId ? postUpload.isUploading : false
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled || !e.dataTransfer.files) return
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    if (postId) {
      postUpload.handleFileSelect(droppedFiles)
    } else {
      prePostUpload.handleFileSelect(droppedFiles)
    }
  }, [disabled, postId, postUpload, prePostUpload])
  
  // Handle file input change
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      if (postId) {
        postUpload.handleFileSelect(selectedFiles)
      } else {
        prePostUpload.handleFileSelect(selectedFiles)
      }
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [postId, postUpload, prePostUpload])
  
  // Handle remove file
  const handleRemoveFile = useCallback((index: number) => {
    if (postId) {
      const attachment = postUpload.uploadedFiles[index]?.attachment
      if (attachment) {
        postUpload.removeAttachment(attachment.id)
      } else {
        postUpload.removePendingFile(index)
      }
    } else {
      prePostUpload.removeFile(index)
    }
  }, [postId, postUpload, prePostUpload])
  
  // Check if we've reached max files
  const canUploadMore = files.length < maxFiles
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Zone */}
      {!isUploading && canUploadMore && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer",
              "hover:border-blue-500/50",
              isDragOver && "border-blue-500 bg-blue-500/10",
              disabled && "opacity-50 cursor-not-allowed",
              glass("subtle")
            )}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple={!postId || postUpload.uploadedFiles.length < maxFiles}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className={cn(
              "rounded-full p-3",
              glass("bubbleAccent")
            )}>
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop files here or <span className="text-blue-500 hover:text-blue-600">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) up to 50MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Uploading State */}
      {isUploading && (
        <div className={cn(
          "rounded-xl p-4 space-y-3",
          glass("card")
        )}>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Uploading files...</span>
          </div>
          <Progress value={undefined} className="h-2" />
        </div>
      )}
      
      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(postId ? postUpload.uploadedFiles : prePostUpload.files.map((f, i) => ({ file: f, preview: prePostUpload.previews[i], attachment: undefined }))).map((fileItem, index) => {
            const file = fileItem.file
            const preview = fileItem.preview
            const attachment = fileItem.attachment
            const isVideo = file.type.startsWith("video/")
            const isUploaded = !!attachment
            
            return (
              <div
                key={index}
                className={cn(
                  "relative group aspect-square rounded-xl overflow-hidden border",
                  "transition-all duration-200",
                  glass("card"),
                  "hover:border-blue-500/50"
                )}
              >
                {/* Preview */}
                {isVideo ? (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={preview}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                
                {/* File Type Badge */}
                <div className="absolute top-2 left-2">
                  {isVideo ? (
                    <div className="bg-black/60 backdrop-blur-sm rounded-md p-1.5">
                      <Video className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-sm rounded-md p-1.5">
                      <ImageIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Upload Status */}
                {isUploaded && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                )}
                
                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile(index)
                    }}
                    className={cn(
                      "absolute bottom-2 right-2 rounded-full p-1.5",
                      "bg-black/60 backdrop-blur-sm text-white",
                      "opacity-0 group-hover:opacity-100",
                      "transition-all duration-200",
                      "hover:bg-destructive"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                
                {/* File Name (on hover) */}
                <div className={cn(
                  "absolute inset-0 bg-black/80 backdrop-blur-sm",
                  "flex items-center justify-center p-2",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all duration-200"
                )}>
                  <span className="text-xs text-white text-center line-clamp-2">
                    {file.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Error State */}
      {!postId && prePostUpload.errors.length > 0 && (
        <div className={cn(
          "rounded-xl p-3 flex items-start gap-3",
          "bg-destructive/10 border border-destructive/20"
        )}>
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              Some files could not be uploaded
            </p>
            <ul className="text-xs text-destructive/80 space-y-0.5">
              {prePostUpload.errors.slice(0, 3).map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
              {prePostUpload.errors.length > 3 && (
                <li>• And {prePostUpload.errors.length - 3} more...</li>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {/* File Count */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{files.length} / {maxFiles} files</span>
          <span>Max 50MB per file</span>
        </div>
      )}
    </div>
  )
}

// ===========================================
// ATTACHMENT GALLERY COMPONENT
// ===========================================

interface AttachmentGalleryProps {
  attachments: Array<{
    file_url: string
    file_type: string
    file_name?: string
    width?: number
    height?: number
  }>
  className?: string
}

/**
 * AttachmentGallery - Display post attachments in a grid
 */
export function AttachmentGallery({ attachments, className }: AttachmentGalleryProps) {
  if (!attachments || attachments.length === 0) return null
  
  const validAttachments = attachments.filter(a => a.file_url)
  if (validAttachments.length === 0) return null
  
  return (
    <div className={cn("space-y-3", className)}>
      {validAttachments.length === 1 ? (
        // Single attachment - full width
        <div className="relative rounded-xl overflow-hidden border">
          {validAttachments[0].file_type === "video" ? (
            <video
              src={validAttachments[0].file_url}
              controls
              className="w-full h-auto max-h-[600px] object-contain bg-black"
            />
          ) : (
            <Image
              src={validAttachments[0].file_url}
              alt={validAttachments[0].file_name || "Attachment"}
              width={validAttachments[0].width || 1200}
              height={validAttachments[0].height || 800}
              className="w-full h-auto max-h-[600px] object-contain bg-black"
              unoptimized
            />
          )}
        </div>
      ) : validAttachments.length === 2 ? (
        // Two attachments - side by side
        <div className="grid grid-cols-2 gap-3">
          {validAttachments.map((attachment, index) => (
            <div key={index} className="relative rounded-xl overflow-hidden border aspect-square">
              {attachment.file_type === "video" ? (
                <video
                  src={attachment.file_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={attachment.file_url}
                  alt={attachment.file_name || "Attachment"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        // Multiple attachments - grid with first item larger
        <div className="grid grid-cols-3 gap-3">
          {/* First item - larger */}
          <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden border aspect-square">
            {validAttachments[0].file_type === "video" ? (
              <video
                src={validAttachments[0].file_url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={validAttachments[0].file_url}
                alt={validAttachments[0].file_name || "Attachment"}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          
          {/* Remaining items */}
          {validAttachments.slice(1, 5).map((attachment, index) => (
            <div key={index} className="relative rounded-xl overflow-hidden border aspect-square">
              {attachment.file_type === "video" ? (
                <video
                  src={attachment.file_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={attachment.file_url}
                  alt={attachment.file_name || "Attachment"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              
              {/* Show +X overlay on last item if more attachments */}
              {index === 3 && validAttachments.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">+{validAttachments.length - 5}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
