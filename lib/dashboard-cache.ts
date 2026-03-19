// ─── Dashboard Cache Utility ─────────────────────────────────────────────────
// Generic localStorage-based cache with graceful error handling.
// Pattern: API → cache → hardcoded fallback (see RequestReminderModal for reference)

export const CACHE_VERSION = '1.0.0'
const DEFAULT_TTL = 1000 * 60 * 30 // 30 minutes

interface CachedData<T> {
    data: T
    timestamp: number
    ttl: number
    version: string
}

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
        
        const parsed: CachedData<T> = JSON.parse(raw)
        const now = Date.now()
        
        // Check TTL
        if (now - parsed.timestamp > parsed.ttl) {
            localStorage.removeItem(key)
            return null
        }
        
        // Check version
        if (parsed.version !== CACHE_VERSION) {
            localStorage.removeItem(key)
            return null
        }
        
        // Validate data
        if (Array.isArray(parsed.data) && parsed.data.length === 0) {
            return null
        }
        
        return parsed.data
    } catch {
        return null
    }
}

export function setCache<T>(key: string, data: T, ttl?: number): void {
    try {
        if (typeof window === "undefined") return
        const cached: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || DEFAULT_TTL,
            version: CACHE_VERSION,
        }
        localStorage.setItem(key, JSON.stringify(cached))
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
