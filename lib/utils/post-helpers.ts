import type { Post } from "@/types/database.types"

/**
 * Get badge variant and label for post type
 */
export function getPostTypeBadge(postType: Post["post_type"]): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  className?: string
} {
  switch (postType) {
    case "project-launch":
      return {
        label: "Project Launch",
        variant: "default",
        className: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
      }
    case "teammate-request":
      return {
        label: "Teammate Request",
        variant: "secondary",
        className: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
      }
    case "announcement":
      return {
        label: "Announcement",
        variant: "destructive",
        className: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
      }
    case "general":
    default:
      return {
        label: "General",
        variant: "outline",
        className: "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30",
      }
  }
}

/**
 * Sort posts by priority (pinned first, then by engagement and recency)
 */
export function sortPostsByPriority<T extends {
  is_pinned?: boolean
  created_at?: string
  reaction_count?: number
  comment_count?: number
}>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    // Pinned posts always first
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1

    // Calculate engagement score
    const aScore = (a.reaction_count || 0) + (a.comment_count || 0) * 2
    const bScore = (b.reaction_count || 0) + (b.comment_count || 0) * 2

    // If both have similar engagement, sort by date
    if (Math.abs(aScore - bScore) < 2) {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
      return bDate - aDate
    }

    // Otherwise sort by engagement
    return bScore - aScore
  })
}

/**
 * Get time ago string from date
 */
export function formatTimeAgo(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
