/**
 * Standardized toast messages for consistent user feedback
 * 
 * Usage:
 * ```ts
 * toast.success(TOAST_MESSAGES.SUCCESS("Post created"))
 * toast.error(TOAST_MESSAGES.ERROR("create post"))
 * toast.info(TOAST_MESSAGES.CACHE_FALLBACK("posts"))
 * ```
 */

export const TOAST_MESSAGES = {
  // Cache fallback messages
  CACHE_FALLBACK: (resource: string) => `Couldn't load latest ${resource}. Showing cached data.`,
  
  // Success messages
  SUCCESS: (action: string) => `${action} successful`,
  COPIED: "Copied to clipboard",
  DOWNLOADED: "Downloaded successfully",
  SAVED: "Changes saved",
  SENT: "Sent successfully",
  CREATED: (item: string) => `${item} created`,
  UPDATED: (item: string) => `${item} updated`,
  DELETED: (item: string) => `${item} deleted`,
  
  // Error messages
  ERROR: (action: string) => `Failed to ${action}`,
  AUTH_ERROR: "Authentication failed. Please log in again.",
  NOT_FOUND: "Item not found",
  UNAUTHORIZED: "You don't have permission to do this",
  
  // Info messages
  LOADING: "Loading...",
  SAVING: "Saving...",
  PROCESSING: "Processing...",
  
  // Specific feature messages
  MATCHES: {
    CACHE: "Showing cached matches",
    NO_MATCHES: "No perfect matches found yet",
    PREFERENCES_UPDATED: "Preferences Updated",
  },
  FEED: {
    CACHE: "Couldn't load latest posts. Showing cached data.",
    NO_POSTS: "No posts yet",
  },
  ACTIVITY: {
    CACHE: "Showing cached activity data",
  },
  NOTIFICATIONS: {
    ALL_READ: "All notifications marked as read",
  },
} as const

/**
 * Toast duration presets
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const

/**
 * Toast ID prefixes for deduplication
 */
export const TOAST_IDS = {
  CACHE_FALLBACK: (key: string) => `cache-fallback-${key}`,
  MATCHES: "matches-cache",
  ACTIVITY: "match-activity-cache",
  FEED: "feed-cache-fallback",
} as const
