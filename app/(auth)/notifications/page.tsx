"use client"

import { NotificationItem } from "@/components/shared/notification-item"
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useUnreadCount,
  useRealtimeNotifications,
} from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { Bell, Check } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications({ limit: 50 })
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const { data: unreadCount } = useUnreadCount()
  
  // Enable real-time updates
  useRealtimeNotifications()

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync()
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your network activity
          </p>
        </div>
        <GlassCard>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your network activity
            </p>
          </div>
          
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <GlassCard>
        <div className="p-6">
          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When you get notifications, they&apos;ll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
