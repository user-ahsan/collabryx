// ─── Dashboard Cache Utility ─────────────────────────────────────────────────
// Generic localStorage-based cache with graceful error handling.
// Pattern: API → cache → hardcoded fallback (see RequestReminderModal for reference)

export const CACHE_KEYS = {
    FEED_POSTS: "collabryx_feed_posts",
    MATCHES: "collabryx_matches",
    MATCH_ACTIVITY: "collabryx_match_activity",
    AI_CONTEXTS: "collabryx_ai_contexts",
} as const

export function getCache<T>(key: string): T | null {
    try {
        if (typeof window === "undefined") return null
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw) as T
        // Basic validation: reject empty arrays
        if (Array.isArray(parsed) && parsed.length === 0) return null
        return parsed
    } catch {
        return null
    }
}

export function setCache<T>(key: string, data: T): void {
    try {
        if (typeof window === "undefined") return
        localStorage.setItem(key, JSON.stringify(data))
    } catch {
        // localStorage full or unavailable — no-op
    }
}

export function clearCache(key: string): void {
    try {
        if (typeof window === "undefined") return
        localStorage.removeItem(key)
    } catch {
        // no-op
    }
}
