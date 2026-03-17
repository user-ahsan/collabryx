/**
 * Notification System - Standardized Types and Colors
 * 
 * Part of Collabryx Design System
 * Follows 4-point grid, standardized typography, and brand colors
 */

import { Bell, Heart, MessageSquare, UserPlus, Users, Star, TrendingUp, Award } from "lucide-react"

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
 * Follows semantic color system
 */
export const NOTIFICATION_COLORS = {
  connect: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    darkText: 'dark:text-blue-400',
  },
  connect_accepted: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    darkText: 'dark:text-green-400',
  },
  message: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    darkText: 'dark:text-emerald-400',
  },
  like: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    darkText: 'dark:text-red-400',
  },
  comment: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
    darkText: 'dark:text-purple-400',
  },
  comment_like: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500/20',
    darkText: 'dark:text-pink-400',
  },
  match: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    darkText: 'dark:text-amber-400',
  },
  mention: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/20',
    darkText: 'dark:text-indigo-400',
  },
  system: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-500',
    border: 'border-gray-500/20',
    darkText: 'dark:text-gray-400',
  },
  achievement: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20',
    darkText: 'dark:text-yellow-400',
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
