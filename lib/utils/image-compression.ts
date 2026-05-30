/**
 * Image Compression Utilities
 * 
 * Client-side image compression using Canvas API (no external dependencies).
 * Compresses images before upload to reduce payload size.
 */

// ===========================================
// CONFIGURATION
// ===========================================

export const IMAGE_CONFIG = {
  // Quality settings (0.0–1.0)
  QUALITY_WEBP: 0.8,
  QUALITY_JPEG: 0.85,

  // Size limits in bytes
  MAX_ORIGINAL_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COMPRESSED_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_AVATAR_SIZE: 512 * 1024, // 512KB
  MAX_BANNER_SIZE: 1024 * 1024, // 1MB

  // Dimensions
  MAX_WIDTH: 2560,
  MAX_HEIGHT: 2560,
  AVATAR_SIZE: 400,
  BANNER_WIDTH: 1200,
  BANNER_HEIGHT: 400,
  THUMBNAIL_SIZE: 300,

  // Formats
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
} as const

// ===========================================
// TYPES
// ===========================================

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg'
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

// ===========================================
// CLIENT-SIDE COMPRESSION (Canvas API)
// ===========================================

/**
 * Compress an image File in the browser using Canvas API.
 * Falls back to the original file if compression fails.
 *
 * @param file - The original image File to compress
 * @param options - Compression dimensions, quality, and output format
 * @returns A Blob (WebP or JPEG) ready for upload
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = IMAGE_CONFIG.AVATAR_SIZE,
    maxHeight = IMAGE_CONFIG.AVATAR_SIZE,
    quality = IMAGE_CONFIG.QUALITY_WEBP,
    format = 'webp',
  } = options

  try {
    // Decode the image using createImageBitmap (GPU-accelerated)
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap

    // Calculate dimensions that fit within the bounding box
    let newWidth = width
    let newHeight = height
    if (newWidth > maxWidth) {
      newHeight = Math.round(newHeight * (maxWidth / newWidth))
      newWidth = maxWidth
    }
    if (newHeight > maxHeight) {
      newWidth = Math.round(newWidth * (maxHeight / newHeight))
      newHeight = maxHeight
    }

    // Render at reduced size onto an offscreen canvas
    const canvas = document.createElement('canvas')
    canvas.width = newWidth
    canvas.height = newHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      throw new Error('Failed to get 2D canvas context')
    }

    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight)
    bitmap.close()

    // Export as compressed blob
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/webp'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result && result.size > 0) {
            resolve(result)
          } else {
            reject(new Error('Canvas toBlob returned empty result'))
          }
        },
        mimeType,
        quality
      )
    })

    return blob
  } catch (err) {
    console.warn('Client-side image compression failed, using original file:', err)
    // Fallback: return the original File as-is
    return file
  }
}

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate image before compression
 */
export function validateImageForCompression(
  file: { name: string; type: string; size: number }
): { valid: true } | { valid: false; error: string } {
  // Check file type
  if (!IMAGE_CONFIG.SUPPORTED_FORMATS.includes(file.type as typeof IMAGE_CONFIG.SUPPORTED_FORMATS[number])) {
    return {
      valid: false,
      error: `Unsupported image type: ${file.type}. Supported: ${IMAGE_CONFIG.SUPPORTED_FORMATS.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_ORIGINAL_SIZE) {
    const maxMB = (IMAGE_CONFIG.MAX_ORIGINAL_SIZE / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `Image too large. Maximum size is ${maxMB}MB`,
    }
  }

  // Check file name extension
  if (!file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return {
      valid: false,
      error: 'Invalid image file extension',
    }
  }

  return { valid: true }
}

/**
 * Get image metadata from a File (uses createImageBitmap, no external packages)
 */
export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    bitmap.close()

    return {
      width,
      height,
      format: file.type || 'unknown',
      size: file.size,
      aspectRatio: width / height,
    }
  } catch (error) {
    console.error('Error getting image metadata:', error)
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: file.size,
      aspectRatio: 0,
    }
  }
}
