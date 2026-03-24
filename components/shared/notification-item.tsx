"use client"

import { cn } from "@/lib/utils"
import { useMarkNotificationAsRead, useDeleteNotification } from "@/hooks/use-notifications"
import type { NotificationWithActor } from "@/lib/services/notifications"
import { useRouter } from "next/navigation"
import { Trash2, UserPlus, MessageSquare, Heart, Star, Bell } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface NotificationItemProps {
  notification: NotificationWithActor
}

const NOTIFICATION_ICONS = {
  connect: UserPlus,
  message: MessageSquare,
  like: Heart,
  comment: MessageSquare,
  match: Star,
  system: Bell,
}

const NOTIFICATION_COLORS = {
  connect: 'text-blue-500 dark:text-blue-400',
  message: 'text-emerald-500 dark:text-emerald-400',
  like: 'text-red-500 dark:text-red-400',
  comment: 'text-purple-500 dark:text-purple-400',
  match: 'text-amber-500 dark:text-amber-400',
  system: 'text-gray-500 dark:text-gray-400',
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    
    try {
      await deleteNotification.mutateAsync(notification.id)
      toast.success("Notification deleted", {
        description: "Undo",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            // Re-add notification logic would go here
          }
        }
      })
    } catch (error) {
      toast.error("Failed to delete notification")
    } finally {
      setIsDeleting(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    const IconComponent = NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Bell
    const colorClass = NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || 'text-gray-500'
    
    return <IconComponent className={cn("h-5 w-5", colorClass)} />
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      handleDelete(e)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Notification: ${notification.content}${!notification.is_read ? ' (unread)' : ''}`}
      aria-pressed={!notification.is_read}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-muted/80 focus:bg-muted/80",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        !notification.is_read && "bg-muted/50 border-l-4 border-l-primary",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-normal leading-tight tracking-tight text-foreground">
          {notification.content}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-tight">
          {notification.time_ago}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.is_read && (
        <div 
          className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" 
          role="status"
          aria-label="Unread"
        />
      )}

      {/* Delete Button - Always visible */}
      <button
        onClick={handleDelete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleDelete(e)
          }
        }}
        disabled={isDeleting}
        className={cn(
          "opacity-40 hover:opacity-100 focus:opacity-100 transition-all duration-200",
          "p-2 h-9 w-9 min-h-[44px] min-w-[44px] flex items-center justify-center",
          "hover:bg-destructive/10 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2",
          isDeleting && "opacity-25 cursor-not-allowed"
        )}
        aria-label={`Delete notification: ${notification.content}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </button>
    </div>
  )
}
