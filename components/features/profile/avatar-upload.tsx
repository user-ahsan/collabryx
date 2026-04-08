'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useUpdateProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  validateAvatar,
  FILE_SIZE_LIMITS,
  ALLOWED_IMAGE_TYPES
} from '@/lib/utils/file-validation'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  className?: string
}

export function AvatarUpload({
  currentAvatarUrl,
  userId: _userId,
  className
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateProfile = useUpdateProfile()
  const supabase = createClient()

  // Update preview when currentAvatarUrl changes
  useEffect(() => {
    setPreview(currentAvatarUrl || null)
  }, [currentAvatarUrl])

  const validateFile = (file: File): string | null => {
    const validation = validateAvatar({
      name: file.name,
      type: file.type,
      size: file.size
    })

    if (!validation.valid) {
      return validation.error
    }

    return null
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar-${Date.now()}.${extension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: _data, error } = await supabase.storage
      .from('profile-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-media')
      .getPublicUrl(fileName)

    return publicUrl
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
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase
      const publicUrl = await uploadToSupabase(file)

      // Update profile
      await updateProfile.mutateAsync({
        avatar_url: publicUrl
      })

      toast.success('Avatar updated successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar'
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
        avatar_url: undefined
      })
      setPreview(null)
      toast.success('Avatar removed')
    } catch (_error) {
      toast.error('Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const maxSizeMB = (FILE_SIZE_LIMITS.AVATAR / 1024 / 1024).toFixed(1)
  const _allowedTypes = ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')

  return (
    <div className={cn('w-full', className)}>
      {/* Avatar Preview */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <div
          className={cn(
            'w-full h-full rounded-full overflow-hidden border-2 transition-colors',
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
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        {!isUploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Remove Button */}
        {preview && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      <div className="text-center">
        <p className="text-sm font-medium mb-1">
          {isUploading ? 'Uploading...' : 'Click or drag to upload'}
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, GIF up to {maxSizeMB}MB
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
          <span>Avatar updated</span>
        </div>
      )}
    </div>
  )
}
