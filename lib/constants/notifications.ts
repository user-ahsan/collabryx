/**
 * Notification System - Standardized Types and Colors
 * 
 * Part of Collabryx Design System
 * Follows 4-point grid, standardized typography, and brand colors
 */

import { Bell, Heart, MessageSquare, UserPlus, Users, Star, TrendingUp, Award } from "lucide-react"

/**
 * Spacing system (4-point grid)
 */
export const NOTIFICATION_SPACING = {
  // Padding
  paddingSm: 8,    // p-2
  paddingMd: 12,   // p-3
  paddingLg: 16,   // p-4
  paddingXl: 20,   // p-5
  
  // Gaps
  gapSm: 8,    // gap-2
  gapMd: 12,   // gap-3
  gapLg: 16,   // gap-4
  
  // Margins
  marginSm: 4,     // m-1
  marginMd: 8,     // m-2
} as const

/**
 * Typography system
 */
export const NOTIFICATION_TYPOGRAPHY = {
  // Font sizes
  title: 'text-lg font-bold tracking-tight leading-tight',      // 18px, -2% letter-spacing, 110% line-height
  heading: 'text-base font-semibold tracking-tight leading-tight', // 16px
  body: 'text-sm font-normal leading-relaxed',                 // 14px
  timestamp: 'text-xs font-medium leading-tight',              // 12px
  
  // Font weights
  weightBold: 'font-bold',
  weightSemibold: 'font-semibold',
  weightMedium: 'font-medium',
  weightRegular: 'font-normal',
} as const

/**
 * Icon sizes (matched to text line-height)
 */
export const NOTIFICATION_ICON_SIZES = {
  trigger: 'h-5 w-5',      // 20px - Bell icon
  notification: 'h-4 w-4', // 16px - Notification type icons
  action: 'h-3.5 w-3.5',   // 14px - Action icons
} as const

/**
 * Notification Types
 * Extended set for comprehensive coverage
 */
export type NotificationType =
  | 'connect'        // Connection requests
  | 'connect_accepted' // Connection accepted
  | 'message'        // New message
  | 'like'           // Post/project liked
  | 'comment'        // Post/comment commented
  | 'comment_like'   // Comment liked
  | 'match'          // New AI match
  | 'mention'        // Mentioned in post/comment
  | 'system'         // System notifications
  | 'achievement'    // Badges, milestones

/**
 * Notification Category for filtering
 */
export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'connections'
  | 'messages'
  | 'engagement'
  | 'matches'
  | 'system'

/**
 * Standardized notification colors
 * Simplified to 5 semantic categories following design system
 * Uses 4-point grid and consistent spacing
 */
export const NOTIFICATION_COLORS = {
  // Connections - Blue (trust, professional)
  connect: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    darkText: 'dark:text-blue-400',
  },
  connect_accepted: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    darkText: 'dark:text-blue-400',
  },
  // Messages - Emerald (communication, success)
  message: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    darkText: 'dark:text-emerald-400',
  },
  // Engagement (likes/comments) - Red (attention, interaction)
  like: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/20',
    darkText: 'dark:text-red-400',
  },
  comment: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/20',
    darkText: 'dark:text-red-400',
  },
  comment_like: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/20',
    darkText: 'dark:text-red-400',
  },
  // Matches/Mentions - Amber (special, highlighted)
  match: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    darkText: 'dark:text-amber-400',
  },
  mention: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    darkText: 'dark:text-amber-400',
  },
  // System/Achievements - Gray (neutral, informational)
  system: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600',
    border: 'border-gray-500/20',
    darkText: 'dark:text-gray-400',
  },
  achievement: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600',
    border: 'border-gray-500/20',
    darkText: 'dark:text-gray-400',
  },
} as const

/**
 * Notification icons (Lucide)
 * Replaces emoji for consistency
 */
export const NOTIFICATION_ICONS = {
  connect: UserPlus,
  connect_accepted: UserPlus,
  message: MessageSquare,
  like: Heart,
  comment: MessageSquare,
  comment_like: Heart,
  match: Star,
  mention: Users,
  system: Bell,
  achievement: Award,
} as const

/**
 * Filter tabs configuration
 */
export const NOTIFICATION_TABS = [
  { id: 'all' as NotificationCategory, label: 'All', icon: Bell },
  { id: 'unread' as NotificationCategory, label: 'Unread', icon: Bell },
  { id: 'connections' as NotificationCategory, label: 'Connections', icon: UserPlus },
  { id: 'messages' as NotificationCategory, label: 'Messages', icon: MessageSquare },
  { id: 'engagement' as NotificationCategory, label: 'Engagement', icon: TrendingUp },
  { id: 'matches' as NotificationCategory, label: 'Matches', icon: Star },
  { id: 'system' as NotificationCategory, label: 'System', icon: Bell },
] as const

/**
 * Map notification types to categories
 */
export const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  connect: 'connections',
  connect_accepted: 'connections',
  message: 'messages',
  like: 'engagement',
  comment: 'engagement',
  comment_like: 'engagement',
  match: 'matches',
  mention: 'engagement',
  system: 'system',
  achievement: 'system',
}

/**
 * Get color classes for notification type
 */
export function getNotificationColorClasses(type: NotificationType) {
  return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.system
}

/**
 * Get icon component for notification type
 */
export function getNotificationIcon(type: NotificationType) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system
}

/**
 * Get category for notification type
 */
export function getNotificationCategory(type: NotificationType) {
  return TYPE_TO_CATEGORY[type] || 'system'
}
