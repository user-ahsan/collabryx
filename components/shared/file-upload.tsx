'use client'

import * as React from 'react'
import { useCallback, useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Get CSRF token from cookies
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

interface FileUploadProps {
  onUpload: (url: string) => void
  onError?: (error: string) => void
  accept?: string
  maxSize?: number
  uploadType?: 'avatar' | 'banner' | 'post'
  className?: string
  disabled?: boolean
  previewUrl?: string | null
  label?: string
  description?: string
}

export function FileUpload({
  onUpload,
  onError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  uploadType = 'post',
  className,
  disabled = false,
  previewUrl,
  label = 'Upload file',
  description
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(previewUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.match(accept.replace('/*', '/'))) {
      return `Invalid file type. Accepted: ${accept}`
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1)
      return `File is too large. Maximum size is ${maxMB}MB`
    }

    return null
  }, [accept, maxSize])

  const handleUpload = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }

    // Clear previous errors
    setError(null)
    setIsUploading(true)
    setProgress(0)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', uploadType)

      // Simulate progress (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Upload file
      const csrfToken = getCSRFToken();
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
        body: formData
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }

      // Call onUpload callback
      onUpload(data.url)
      
      // Reset after delay
      setTimeout(() => {
        setProgress(0)
      }, 1000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, uploadType, onUpload, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }, [disabled, handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input value to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleUpload])

  const handleRemove = useCallback(() => {
    setPreview(null)
    onUpload('')
    setError(null)
  }, [onUpload])

  const getFileIcon = () => {
    if (accept.includes('image')) {
      return <ImageIcon className="w-8 h-8" />
    }
    return <FileText className="w-8 h-8" />
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 pointer-events-none',
          preview && 'border-solid'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          // Preview Mode
          <div className="relative">
            {accept.includes('image') ? (
              <img
                src={preview}
                alt="Preview"
                className={cn(
                  'max-h-64 w-full object-contain rounded-md',
                  uploadType === 'avatar' && 'w-32 h-32 rounded-full object-cover mx-auto'
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-32">
                {getFileIcon()}
              </div>
            )}
            
            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // Upload Prompt
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-muted-foreground mb-4">
              {getFileIcon()}
            </div>
            
            <p className="text-sm font-medium mb-1">
              Drag and drop your file here
            </p>
            
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>

            {description && (
              <p className="text-xs text-muted-foreground mb-4">
                {description}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {/* Success State */}
        {progress === 100 && !isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Upload complete!</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
