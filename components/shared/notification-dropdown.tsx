"use client"

import { useRouter } from "next/navigation"
import { Check, Trash2, Bell } from "lucide-react"
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

interface NotificationDropdownProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NotificationDropdown({ open, onOpenChange }: NotificationDropdownProps) {
  const router = useRouter()
  const { data: notifications, isLoading } = useNotifications({ limit: 10 })
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const markAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()
  
  // Enable real-time updates
  useRealtimeNotifications()

  const handleNotificationClick = (notificationId: string, resourceType?: string, resourceId?: string) => {
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
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
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
      default:
        return '🔔'
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  return (
    <div className="w-[400px] max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          className="h-8 text-xs"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Mark all read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(
                notification.id,
                notification.resource_type || undefined,
                notification.resource_id || undefined
              )}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors",
                "hover:bg-muted/50",
                !notification.is_read && "bg-muted/30"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notification.time_ago}
                  </p>
                </div>

                {/* Actions */}
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                )}
                
                <button
                  onClick={(e) => handleDelete(e, notification.id)}
                  className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
