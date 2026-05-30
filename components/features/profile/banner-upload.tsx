'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useUpdateProfile } from '@/hooks/use-profile'
import { compressImage } from '@/lib/utils/image-compression'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import {
  validateBanner,
  FILE_SIZE_LIMITS
} from '@/lib/utils/file-validation'

interface BannerUploadProps {
  currentBannerUrl?: string | null
  className?: string
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? match[1] : null
}

export function BannerUpload({
  currentBannerUrl,
  className
}: BannerUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentBannerUrl || null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateProfile = useUpdateProfile()
  const imageRef = useRef<HTMLImageElement>(null)

  // Update preview when currentBannerUrl changes
  useEffect(() => {
    setPreview(currentBannerUrl || null)
  }, [currentBannerUrl])

  const validateAspectRatio = (width: number, height: number): string | null => {
    const aspectRatio = width / height
    const targetRatio = 16 / 9
    const tolerance = 0.15 // 15% tolerance

    if (Math.abs(aspectRatio - targetRatio) > tolerance) {
      return `Banner should have a 16:9 aspect ratio. Current ratio is ${aspectRatio.toFixed(2)}:1`
    }

    return null
  }

  const validateFile = (file: File): string | null => {
    const validation = validateBanner({
      name: file.name,
      type: file.type,
      size: file.size
    })

    if (!validation.valid) {
      return validation.error
    }

    return null
  }

  const uploadViaApi = async (file: File): Promise<string> => {
    // Compress image before upload (max 1200x400, WebP, quality 0.85)
    const compressed = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 400,
      quality: 0.85,
      format: 'webp'
    })

    const formData = new FormData()
    formData.append('file', compressed, file.name)
    formData.append('type', 'banner')

    const csrfToken = getCsrfToken()

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed')
    }

    return result.data.url as string
  }

  const handleUpload = async (file: File) => {
    setError(null)
    
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setIsUploading(true)

    try {
      // Create preview and validate aspect ratio
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const aspectError = validateAspectRatio(img.width, img.height)
            if (aspectError) {
              setError(aspectError)
              toast.error(aspectError)
              reject(new Error(aspectError))
            } else {
              setPreview(e.target?.result as string)
              resolve()
            }
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      // Upload via server API route
      const publicUrl = await uploadViaApi(file)

      // Update profile
      await updateProfile.mutateAsync({
        banner_url: publicUrl
      })

      toast.success('Banner updated successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('aspect ratio')) {
        // Aspect ratio error, already handled
        return
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload banner'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (isUploading) return

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input to allow re-uploading same file
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    try {
      await updateProfile.mutateAsync({
        banner_url: undefined
      })
      setPreview(null)
      toast.success('Banner removed')
    } catch (error) {
      logger.app.error('Failed to remove banner', { error })
      toast.error('Failed to remove banner')
    } finally {
      setIsUploading(false)
    }
  }

  const maxSizeMB = (FILE_SIZE_LIMITS.BANNER / 1024 / 1024).toFixed(1)

  return (
    <div className={cn('w-full', className)}>
      {/* Banner Preview */}
      <div
        className={cn(
          'relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-colors',
          dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
          isUploading && 'opacity-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          /* eslint-disable @next/next/no-img-element */
          <img
            ref={imageRef}
            src={preview}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload banner</p>
            </div>
          </div>
        )}

        {/* Upload Overlay */}
        {!isUploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Upload className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Remove Button */}
        {preview && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Instructions */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium mb-1">
          {isUploading ? 'Uploading...' : 'Click or drag to upload banner'}
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, GIF up to {maxSizeMB}MB • Recommended: 1920x1080 (16:9)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center justify-center gap-2 text-destructive text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {!isUploading && !error && preview && (
        <div className="mt-2 flex items-center justify-center gap-2 text-green-600 text-xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Banner updated</span>
        </div>
      )}
    </div>
  )
}
