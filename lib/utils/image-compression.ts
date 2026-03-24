/**
 * Image Compression Utilities
 * 
 * Compresses images before upload using sharp library
 * Converts to WebP for optimal web performance
 * Implements size limits and quality optimization
 */

// ===========================================
// CONFIGURATION
// ===========================================

export const IMAGE_CONFIG = {
  // Quality settings (0-100)
  QUALITY_WEBP: 80,
  QUALITY_JPEG: 85,
  QUALITY_PNG: 85,
  
  // Size limits in bytes
  MAX_ORIGINAL_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COMPRESSED_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_AVATAR_SIZE: 512 * 1024, // 512KB
  MAX_BANNER_SIZE: 1024 * 1024, // 1MB
  
  // Dimensions
  MAX_WIDTH: 2560,
  MAX_HEIGHT: 2560,
  AVATAR_SIZE: 400,
  BANNER_WIDTH: 1920,
  BANNER_HEIGHT: 480,
  THUMBNAIL_SIZE: 300,
  
  // Formats
  PREFERRED_FORMAT: 'webp' as const,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
} as const

// ===========================================
// TYPES
// ===========================================

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  maintainAspectRatio?: boolean
}

export interface CompressionResult {
  buffer: Buffer
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
  format: string
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

// ===========================================
// COMPRESSION FUNCTIONS
// ===========================================

/**
 * Compress image buffer using sharp
 * 
 * Note: This function requires the 'sharp' package to be installed
 * If sharp is not available, returns original buffer
 */
export async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = IMAGE_CONFIG.MAX_WIDTH,
    maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
    quality = IMAGE_CONFIG.QUALITY_WEBP,
    format = IMAGE_CONFIG.PREFERRED_FORMAT,
    maintainAspectRatio = true,
  } = options
  
  const originalSize = buffer.length
  
  try {
    // Try to use sharp if available
    const sharp = await import('sharp').catch(() => null)
    
    if (!sharp) {
      console.warn('Sharp not available, returning original image')
      return {
        buffer,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        width: 0,
        height: 0,
        format: 'unknown',
      }
    }
    
    // Get image metadata
    const metadata = await sharp.default(buffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0
    
    // Calculate new dimensions
    let newWidth = originalWidth
    let newHeight = originalHeight
    
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
      newWidth = Math.floor(originalWidth * ratio)
      newHeight = Math.floor(originalHeight * ratio)
    }
    
    // Compress image
    const pipeline = sharp.default(buffer)
      .resize(newWidth, newHeight, {
        fit: maintainAspectRatio ? 'inside' : 'fill',
        withoutEnlargement: true,
      })
    
    // Apply format-specific compression
    let compressedPipeline
    switch (format) {
      case 'webp':
        compressedPipeline = pipeline.webp({ quality, effort: 6 })
        break
      case 'jpeg':
        compressedPipeline = pipeline.jpeg({ quality, progressive: true })
        break
      case 'png':
        compressedPipeline = pipeline.png({ quality, compressionLevel: 8 })
        break
      default:
        compressedPipeline = pipeline
    }
    
    const compressedBuffer = await compressedPipeline.toBuffer()
    const compressedSize = compressedBuffer.length
    
    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
      width: newWidth,
      height: newHeight,
      format,
    }
  } catch {
    console.error('Image compression failed:', error)
    // Return original buffer on error
    return {
      buffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      width: 0,
      height: 0,
      format: 'unknown',
    }
  }
}

/**
 * Compress avatar image
 */
export async function compressAvatar(buffer: Buffer): Promise<CompressionResult> {
  return compressImage(buffer, {
    maxWidth: IMAGE_CONFIG.AVATAR_SIZE,
    maxHeight: IMAGE_CONFIG.AVATAR_SIZE,
    quality: IMAGE_CONFIG.QUALITY_WEBP,
    format: 'webp',
    maintainAspectRatio: true,
  })
}

/**
 * Compress banner image
 */
export async function compressBanner(buffer: Buffer): Promise<CompressionResult> {
  return compressImage(buffer, {
    maxWidth: IMAGE_CONFIG.BANNER_WIDTH,
    maxHeight: IMAGE_CONFIG.BANNER_HEIGHT,
    quality: IMAGE_CONFIG.QUALITY_WEBP,
    format: 'webp',
    maintainAspectRatio: false,
  })
}

/**
 * Compress post image
 */
export async function compressPostImage(buffer: Buffer): Promise<CompressionResult> {
  return compressImage(buffer, {
    maxWidth: IMAGE_CONFIG.MAX_WIDTH,
    maxHeight: IMAGE_CONFIG.MAX_HEIGHT,
    quality: IMAGE_CONFIG.QUALITY_WEBP,
    format: 'webp',
    maintainAspectRatio: true,
  })
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(buffer: Buffer, size: number = IMAGE_CONFIG.THUMBNAIL_SIZE): Promise<CompressionResult> {
  return compressImage(buffer, {
    maxWidth: size,
    maxHeight: size,
    quality: 70,
    format: 'webp',
    maintainAspectRatio: true,
  })
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
  
  // Check file name
  if (!file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return {
      valid: false,
      error: 'Invalid image file extension',
    }
  }
  
  return { valid: true }
}

/**
 * Check if compressed size is within limits
 */
export function validateCompressedSize(
  result: CompressionResult,
  type: 'avatar' | 'banner' | 'post'
): { valid: true } | { valid: false; error: string } {
  let maxSize: number
  
  switch (type) {
    case 'avatar':
      maxSize = IMAGE_CONFIG.MAX_AVATAR_SIZE
      break
    case 'banner':
      maxSize = IMAGE_CONFIG.MAX_BANNER_SIZE
      break
    case 'post':
    default:
      maxSize = IMAGE_CONFIG.MAX_COMPRESSED_SIZE
      break
  }
  
  if (result.compressedSize > maxSize) {
    return {
      valid: false,
      error: `Compressed image still too large (${(result.compressedSize / 1024).toFixed(1)}KB, max: ${(maxSize / 1024).toFixed(1)}KB)`,
    }
  }
  
  return { valid: true }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const sharp = await import('sharp').catch(() => null)
    
    if (!sharp) {
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        size: buffer.length,
        aspectRatio: 0,
      }
    }
    
    const metadata = await sharp.default(buffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    
    
    return {
      width,
      height,
      format: (metadata.format as string) || 'unknown',
      size: buffer.length,
      aspectRatio: width / height,
    }
  } catch {
    console.error('Error getting image metadata:', error)
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: buffer.length,
      aspectRatio: 0,
    }
  }
}
