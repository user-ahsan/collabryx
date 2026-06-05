/**
 * SessionHeartbeat
 *
 * Invisible Client Component that fires heartbeat events based on page
 * visibility changes instead of continuous polling.
 *
 * Behavior:
 *   - Fires immediately on component mount
 *   - Fires when the page becomes visible (user returns to tab)
 *   - Fires when the page is about to be hidden/unloaded
 *   - Swallows errors gracefully (non-critical analytics)
 *   - Automatically cleans up on unmount
 *
 * Usage (inside a layout or page):
 *   <SessionHeartbeat />
 */

"use client"

import { useEffect, useRef } from "react"

export function SessionHeartbeat() {
  const lastBeatRef = useRef(0)
  const minIntervalMs = 30_000 // Don't fire more often than every 30s

  useEffect(() => {
    const sendHeartbeat = async () => {
      const now = Date.now()
      if (now - lastBeatRef.current < minIntervalMs) return
      lastBeatRef.current = now

      try {
        const res = await fetch("/api/analytics/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok && res.status === 401) {
          // User logged out — nothing to do, component will unmount
        }
      } catch {
        // Silently ignore — heartbeat is best-effort
      }
    }

    // Fire on mount
    sendHeartbeat()

    // Fire when tab becomes visible (user returns)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    // Fire on beforeunload (user leaves page)
    const onBeforeUnload = () => {
      // Use sendBeacon for reliable delivery during page unload
      try {
        navigator.sendBeacon("/api/analytics/heartbeat")
      } catch {
        // Best-effort
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("beforeunload", onBeforeUnload)
      // Send final heartbeat on unmount
      sendHeartbeat()
    }
  }, [])

  return null
}
