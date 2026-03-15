"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMarkNotificationAsRead, useDeleteNotification } from "@/hooks/use-notifications"
import type { NotificationWithActor } from "@/lib/services/notifications"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

interface NotificationItemProps {
  notification: NotificationWithActor
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()

  const handleClick = async () => {
    // Mark as read
    await markAsRead.mutateAsync(notification.id)
    
    // Navigate to resource
    if (notification.resource_type && notification.resource_id) {
      switch (notification.resource_type) {
        case 'post':
          router.push(`/post/${notification.resource_id}`)
          break
        case 'profile':
          router.push(`/profile/${notification.resource_id}`)
          break
        case 'conversation':
          router.push(`/messages/${notification.resource_id}`)
          break
        case 'match':
          router.push(`/matches`)
          break
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification.mutateAsync(notification.id)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connect':
        return '🤝'
      case 'message':
        return '💬'
      case 'like':
        return '❤️'
      case 'comment':
        return '💭'
      case 'match':
        return '✨'
      case 'system':
        return '🔔'
      default:
        return '🔔'
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors",
        "hover:bg-muted/50",
        !notification.is_read && "bg-muted/30 border-l-4 border-primary"
      )}
    >
      {/* Icon */}
      <div className="text-2xl shrink-0">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          {notification.content}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {notification.time_ago}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="opacity-0 hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </button>
    </div>
  )
}
