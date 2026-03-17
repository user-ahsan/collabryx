"use client"

import { useRouter } from "next/navigation"
import { Check, Trash2, Bell, UserPlus, MessageSquare, Heart, Star } from "lucide-react"
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useRealtimeNotifications,
} from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { toast } from "sonner"

interface NotificationDropdownProps {
  onOpenChange?: (open: boolean) => void
}

const NOTIFICATION_ICONS = {
  connect: UserPlus,
  message: MessageSquare,
  like: Heart,
  comment: MessageSquare,
  match: Star,
}

const NOTIFICATION_COLORS = {
  connect: 'text-blue-500 dark:text-blue-400',
  message: 'text-emerald-500 dark:text-emerald-400',
  like: 'text-red-500 dark:text-red-400',
  comment: 'text-purple-500 dark:text-purple-400',
  match: 'text-amber-500 dark:text-amber-400',
}

export function NotificationDropdown({ onOpenChange }: NotificationDropdownProps) {
  const router = useRouter()
  const { data: notifications, isLoading, error } = useNotifications({ limit: 10 })
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const markAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  
  // Enable real-time updates
  useRealtimeNotifications()

  const handleNotificationClick = useCallback((notificationId: string, resourceType?: string, resourceId?: string) => {
    // Mark as read
    markAsRead.mutate(notificationId)
    
    // Navigate to resource
    if (resourceType && resourceId) {
      switch (resourceType) {
        case 'post':
          router.push(`/post/${resourceId}`)
          break
        case 'profile':
          router.push(`/profile/${resourceId}`)
          break
        case 'conversation':
          router.push(`/messages/${resourceId}`)
          break
        case 'match':
          router.push(`/matches`)
          break
      }
    }
    
    onOpenChange?.(false)
  }, [markAsRead, router, onOpenChange])

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read")
      },
      onError: () => {
        toast.error("Failed to mark notifications as read")
      }
    })
  }, [markAllAsRead])

  const handleDelete = useCallback((e: React.MouseEvent | React.KeyboardEvent, notificationId: string) => {
    e.stopPropagation()
    
    // Optimistic update
    setDeletedIds(prev => new Set(prev).add(notificationId))
    
    deleteNotification.mutate(notificationId, {
      onSuccess: () => {
        toast.success("Notification deleted", {
          description: "Undo",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              setDeletedIds(prev => {
                const next = new Set(prev)
                next.delete(notificationId)
                return next
              })
            }
          }
        })
      },
      onError: () => {
        setDeletedIds(prev => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
        toast.error("Failed to delete notification")
      }
    })
  }, [deleteNotification])

  const getNotificationIcon = (type: string) => {
    const IconComponent = NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || Bell
    const colorClass = NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || 'text-gray-500'
    
    return <IconComponent className={cn("h-5 w-5 shrink-0", colorClass)} />
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent, notificationId: string, resourceType?: string, resourceId?: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNotificationClick(notificationId, resourceType, resourceId)
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      handleDelete(e, notificationId)
    }
  }, [handleNotificationClick, handleDelete])

  if (isLoading) {
    return (
      <div className="p-4 space-y-3" aria-busy="true" aria-live="polite">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-5 w-5 rounded bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground mb-4">Failed to load notifications</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center" role="status">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="w-full min-w-[380px] max-w-[420px] max-h-[500px] flex flex-col" role="region" aria-label="Notifications">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg tracking-tight text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="h-5 px-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-full flex items-center justify-center">
              {unreadCount} new
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={markAllAsRead.isPending || unreadCount === 0}
          className="h-8 text-xs"
          aria-label="Mark all notifications as read"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Mark all read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2" role="list" aria-label="Notification list">
          {notifications
            .filter(n => !deletedIds.has(n.id))
            .map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                aria-label={`Notification: ${notification.content}${!notification.is_read ? ' (unread)' : ''}`}
                aria-pressed={!notification.is_read}
                onClick={() => handleNotificationClick(
                  notification.id,
                  notification.resource_type || undefined,
                  notification.resource_id || undefined
                )}
                onKeyDown={(e) => handleKeyDown(e, notification.id, notification.resource_type || undefined, notification.resource_id || undefined)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-muted/80 focus:bg-muted/80",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  !notification.is_read && "bg-muted/50 border-l-4 border-l-primary"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-normal leading-tight tracking-tight truncate">
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
                    onClick={(e) => handleDelete(e, notification.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleDelete(e, notification.id)
                      }
                    }}
                    className={cn(
                      "opacity-40 hover:opacity-100 focus:opacity-100 transition-all duration-200",
                      "p-2 h-9 w-9 min-h-[44px] min-w-[44px] flex items-center justify-center",
                      "hover:bg-destructive/10 rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                    )}
                    aria-label={`Delete notification: ${notification.content}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  )
}
