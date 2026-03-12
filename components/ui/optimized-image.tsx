"use client"

import Image, { ImageProps } from "next/image"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoadingComplete"> {
  className?: string
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  aspectRatio?: "square" | "video" | "portrait" | "custom"
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  lazy?: boolean
}

export function OptimizedImage({
  className,
  blurDataURL,
  aspectRatio = "square",
  objectFit = "cover",
  lazy = true,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "portrait" && "aspect-[3/4]",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted transition-all duration-300",
        isLoading && "animate-pulse",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "video" && "aspect-video",
        aspectRatio === "portrait" && "aspect-[3/4]",
        className
      )}
    >
      <Image
        {...props}
        alt={alt || ""}
        loading={lazy ? "lazy" : "eager"}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        onLoadingComplete={handleLoadComplete}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          objectFit === "fill" && "object-fill",
          objectFit === "none" && "object-none",
          objectFit === "scale-down" && "object-scale-down"
        )}
      />
    </div>
  )
}

export function Avatar({
  src,
  alt,
  size = "md",
  className,
}: {
  src: string
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn("rounded-full", sizeClasses[size], className)}
      aspectRatio="square"
      objectFit="cover"
      sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, 48px"
    />
  )
}

export function PostImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn("rounded-lg", className)}
      aspectRatio="video"
      objectFit="cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  )
}
