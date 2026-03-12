"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface PrefetchConfig {
  path: string
  priority?: "high" | "low"
  as?: string
}

const PREFETCH_ROUTES: PrefetchConfig[] = [
  { path: "/dashboard", priority: "high" },
  { path: "/matches", priority: "high" },
  { path: "/messages", priority: "high" },
  { path: "/notifications", priority: "low" },
  { path: "/profile", priority: "low" },
  { path: "/settings", priority: "low" },
]

export function useRoutePrefetch() {
  const pathname = usePathname()

  useEffect(() => {
    const prefetchQueue: PrefetchConfig[] = []

    PREFETCH_ROUTES.forEach(route => {
      if (route.path !== pathname) {
        prefetchQueue.push(route)
      }
    })

    prefetchQueue.sort((a, b) => {
      if (a.priority === "high" && b.priority === "low") return -1
      if (a.priority === "low" && b.priority === "high") return 1
      return 0
    })

    prefetchQueue.forEach((route, index) => {
      const delay = route.priority === "high" ? index * 100 : index * 300 + 500
      
      const timeoutId = setTimeout(() => {
        prefetchRoute(route.path)
      }, delay)

      return () => clearTimeout(timeoutId)
    })
  }, [pathname])
}

function prefetchRoute(path: string) {
  if (typeof window === "undefined") return

  const link = document.createElement("link")
  link.rel = "prefetch"
  link.href = path
  link.as = "document"
  
  document.head.appendChild(link)

  return () => {
    document.head.removeChild(link)
  }
}

export function preloadFont(url: string) {
  if (typeof window === "undefined") return

  const link = document.createElement("link")
  link.rel = "preload"
  link.href = url
  link.as = "font"
  link.crossOrigin = "anonymous"
  
  document.head.appendChild(link)
}

export function preloadImage(url: string, priority: "high" | "low" = "low") {
  if (typeof window === "undefined") return

  const link = document.createElement("link")
  link.rel = priority === "high" ? "preload" : "prefetch"
  link.href = url
  link.as = "image"
  
  document.head.appendChild(link)
}

export function preloadScript(url: string, async = true) {
  if (typeof window === "undefined") return

  const script = document.createElement("script")
  script.src = url
  script.async = async
  
  if (async) {
    document.head.appendChild(script)
  } else {
    script.defer = true
    document.head.appendChild(script)
  }
}

export function useResourceHints() {
  const pathname = usePathname()

  useEffect(() => {
    const dnsPrefetchDomains = [
      "https://*.supabase.co",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://analytics.vercel.com",
    ]

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement("link")
      link.rel = "dns-prefetch"
      link.href = domain
      document.head.appendChild(link)
    })

    const preconnectDomains = [
      "https://*.supabase.co",
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement("link")
      link.rel = "preconnect"
      link.href = domain
      link.crossOrigin = "anonymous"
      document.head.appendChild(link)
    })
  }, [pathname])
}

export function getPreloadLinks(pathname: string) {
  const basePreloads = [
    {
      rel: "preload",
      href: "/fonts/inter-var.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: "/fonts/space-grotesk-var.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
  ]

  if (pathname === "/") {
    basePreloads.push(
      {
        rel: "preload",
        href: "/images/hero-globe.webp",
        as: "image",
        type: "image/webp",
        crossOrigin: "anonymous",
      }
    )
  }

  return basePreloads
}
