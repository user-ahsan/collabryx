/**
 * Image Optimization Helpers
 * 
 * Utilities for lazy loading, blur placeholders, and progressive image loading
 */

/**
 * Generate a low-quality image placeholder (LQIP) data URL
 * Creates a tiny base64 image for blur-up effect
 */
export function generateBlurPlaceholder(width = 10, height = 10, color = "#e5e5e5"): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}" />
    </svg>
  `
  const base64 = Buffer.from(svg.trim()).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Get responsive image sizes for different viewports
 */
export function getImageSizes(
  breakpoint: "avatar" | "thumbnail" | "post" | "hero" | "full"
): string {
  const sizes = {
    avatar: "(max-width: 640px) 32px, (max-width: 768px) 40px, 48px",
    thumbnail: "(max-width: 640px) 100px, (max-width: 768px) 150px, 200px",
    post: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    hero: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px",
    full: "100vw",
  }
  return sizes[breakpoint]
}

/**
 * Image loading priority based on position
 * Above-fold images should be eager loaded
 */
export function getImagePriority(index: number, viewportPosition: "above" | "below" = "below"): "high" | "low" {
  // First 3 images or above-fold should be eager
  if (index < 3 || viewportPosition === "above") {
    return "high"
  }
  return "low"
}

/**
 * Intersection Observer options for lazy loading
 */
export const lazyLoadObserverOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: "50px", // Start loading 50px before entering viewport
  threshold: 0.01, // Trigger when 1% visible
}

/**
 * Image format priority (best to worst)
 */
export const IMAGE_FORMATS = ["avif", "webp", "jpg"] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(): ImageFormat {
  if (typeof window === "undefined") return "jpg"
  
  const canvas = document.createElement("canvas")
  
  // Check AVIF support (best compression)
  if (canvas.toDataURL("image/avif").startsWith("data:image/avif")) {
    return "avif"
  }
  
  // Check WebP support (good compression)
  if (canvas.toDataURL("image/webp").startsWith("data:image/webp")) {
    return "webp"
  }
  
  // Fallback to JPEG
  return "jpg"
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: "image" | "fetch" = "image"): void {
  if (typeof window === "undefined") return
  
  const link = document.createElement("link")
  link.rel = "preload"
  link.as = as
  link.href = src
  if (as === "image") {
    ;(link as HTMLLinkElement & { imageSrcset: string }).imageSrcset = src
    link.imageSizes = "100vw"
  }
  document.head.appendChild(link)
}

/**
 * Image cache for preventing duplicate loads
 */
const imageCache = new Map<string, Promise<HTMLImageElement>>()

/**
 * Load image with caching to prevent duplicate network requests
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return cached
  
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  
  imageCache.set(src, promise)
  return promise
}

/**
 * Clear image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear()
}

/**
 * Responsive image sources for different screen sizes
 */
export interface ResponsiveImageSources {
  src: string
  src2x?: string
  src3x?: string
}

/**
 * Generate responsive image sources
 */
export function getResponsiveSources(
  basePath: string,
  format: ImageFormat = "webp"
): ResponsiveImageSources {
  return {
    src: `${basePath}.${format}`,
    src2x: `${basePath}@2x.${format}`,
    src3x: `${basePath}@3x.${format}`,
  }
}

/**
 * Image aspect ratio helpers
 */
export const ASPECT_RATIOS = {
  square: "1/1",
  portrait: "3/4",
  landscape: "4/3",
  video: "16/9",
  cinematic: "21/9",
} as const

export type AspectRatio = keyof typeof ASPECT_RATIOS

/**
 * Get CSS aspect ratio value
 */
export function getAspectRatioValue(ratio: AspectRatio): string {
  return ASPECT_RATIOS[ratio]
}

/**
 * Calculate optimized image dimensions
 */
export function calculateOptimizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight }
  }
  
  const ratio = maxWidth / originalWidth
  return {
    width: maxWidth,
    height: Math.round(originalHeight * ratio),
  }
}

/**
 * Image loading state types
 */
export type ImageLoadingState = "idle" | "loading" | "loaded" | "error"

/**
 * Hook-like utility for tracking image loading state
 * (Use in components with useState)
 */
export function createImageLoadingState(): {
  state: ImageLoadingState
  isLoading: boolean
  hasLoaded: boolean
  hasError: boolean
  setState: (state: ImageLoadingState) => void
} {
  let state: ImageLoadingState = "idle"
  
  return {
    get state() {
      return state
    },
    get isLoading() {
      return state === "loading"
    },
    get hasLoaded() {
      return state === "loaded"
    },
    get hasError() {
      return state === "error"
    },
    setState(newState: ImageLoadingState) {
      state = newState
    },
  }
}

/**
 * Get blur data URL for common colors
 */
export function getBlurColor(color: "gray" | "white" | "black" | "transparent"): string {
  const colors = {
    gray: generateBlurPlaceholder(10, 10, "#e5e5e5"),
    white: generateBlurPlaceholder(10, 10, "#ffffff"),
    black: generateBlurPlaceholder(10, 10, "#000000"),
    transparent: generateBlurPlaceholder(10, 10, "transparent"),
  }
  return colors[color]
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch (_error) {
    return false
  }
}

/**
 * Get CDN-optimized image URL
 */
export function getCdnImageUrl(
  src: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: ImageFormat
  }
): string {
  if (!options) return src
  
  const { width = 800, height, quality = 80, format = "webp" } = options
  const params = new URLSearchParams()
  
  params.set("w", width.toString())
  params.set("q", quality.toString())
  params.set("fm", format)
  
  if (height) {
    params.set("h", height.toString())
    params.set("fit", "crop")
  }
  
  // Support for common CDNs (Vercel, Cloudinary, Imgix patterns)
  if (src.includes("vercel.app") || src.includes("netlify.app")) {
    return `${src}?${params.toString()}`
  }
  
  // Return original if no CDN detected
  return src
}
