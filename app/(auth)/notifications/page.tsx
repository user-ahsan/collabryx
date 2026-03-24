"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
} from "lucide-react"
import {
  NOTIFICATION_TABS,
  getNotificationColorClasses,
  getNotificationIcon,
  getNotificationCategory,
  type NotificationType,
  type NotificationCategory,
} from "@/lib/constants/notifications"
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useRealtimeNotifications,
} from "@/hooks/use-notifications"
import { useConnectionRequests } from "@/hooks/use-connection-requests"
import { toast } from "sonner"
import type { Notification } from "@/types/database.types"

interface DisplayNotification {
  id: string
  type: NotificationType
  actor: { name: string; avatar: string }
  content: string
  time: string
  read: boolean
  resourceType?: 'post' | 'profile' | 'conversation' | 'match'
  resourceId?: string
  connectionId?: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function NotificationListItem({
  notification,
  onAccept,
  onIgnore,
  onDismiss,
}: {
  notification: DisplayNotification
  onAccept?: () => void
  onIgnore?: () => void
  onDismiss?: () => void
}) {
  const colors = getNotificationColorClasses(notification.type)
  const IconComponent = getNotificationIcon(notification.type)

  // Render icon directly without creating component during render
  const renderIcon = () => {
    if (!IconComponent) return null
    const Icon = IconComponent
    return <Icon className="h-5 w-5" />
  }

  return (
    <GlassCard
      hoverable
      className={cn(
        "group transition-all duration-300",
        !notification.read && "border-l-4 border-l-primary shadow-[0_0_15px_rgba(59,130,246,0.08)]"
      )}
      innerClassName="flex items-start gap-4 p-4 md:p-6"
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 p-3 rounded-full shrink-0 backdrop-blur-sm transition-colors",
        colors.bg,
        colors.text,
        colors.darkText
      )}>
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-semibold text-foreground">{notification.actor.name}</span>{" "}
            <span className="text-muted-foreground/80">{notification.content}</span>
          </p>
          <span className="text-xs text-muted-foreground/60 whitespace-nowrap mt-0.5">
            {notification.time}
          </span>
        </div>

        {/* Action Buttons for Connection Requests */}
        {notification.type === "connect" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="default"
              className="h-9 px-4 text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation()
                onAccept?.()
              }}
            >
              Accept
            </Button>
            <Button
              size="default"
              variant="ghost"
              className="h-9 px-4 text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onIgnore?.()
              }}
            >
              Ignore
            </Button>
          </div>
        )}
      </div>

      {/* Dismiss Button (hover only) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive focus-visible:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss?.()
        }}
        aria-label="Dismiss notification"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </GlassCard>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch real notifications
  const { data: notifications = [], isLoading: isLoadingNotifications } = useNotifications({ limit: 50 })
  const { mutate: markAsRead } = useMarkNotificationAsRead()
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()
  const { acceptRequest, declineRequest, isLoading: isActionLoading } = useConnectionRequests()
  
  // Subscribe to real-time notifications
  useRealtimeNotifications()

  // Transform database notifications to display format
  const displayNotifications: DisplayNotification[] = useMemo(() => {
    return notifications.map((notif: Notification) => ({
      id: notif.id,
      type: notif.type as NotificationType,
      actor: {
        name: notif.actor_name || 'Unknown',
        avatar: notif.actor_avatar || '',
      },
      content: notif.content,
      time: formatTimeAgo(notif.created_at),
      read: notif.is_read,
      resourceType: notif.resource_type,
      resourceId: notif.resource_id,
      connectionId: notif.type === 'connect' ? notif.id : undefined,
    }))
  }, [notifications])

  const unreadCount = displayNotifications.filter((n) => !n.read).length

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Filter notifications based on active tab
  const filteredNotifications = displayNotifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    const category = getNotificationCategory(n.type)
    return category === activeTab
  })

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast.success('All notifications marked as read')
      },
      onError: () => {
        toast.error('Failed to mark all as read')
      },
    })
  }, [markAllAsRead])

  const handleClearAllRead = useCallback(() => {
    const readIds = displayNotifications.filter((n) => n.read).map((n) => n.id)
    readIds.forEach((id) => {
      deleteNotification(id, {
        onSuccess: () => {
          toast.success('Notification deleted')
        },
        onError: () => {
          toast.error('Failed to delete notification')
        },
      })
    })
    toast.success(`${readIds.length} notifications cleared`)
  }, [displayNotifications, deleteNotification])

  const handleDismiss = useCallback((id: string) => {
    deleteNotification(id, {
      onSuccess: () => {
        toast.success('Notification dismissed')
      },
      onError: () => {
        toast.error('Failed to dismiss notification')
      },
    })
  }, [deleteNotification])

  const handleAccept = useCallback(async (notificationId: string) => {
    const success = await acceptRequest(notificationId)
    if (success) {
      toast.success('Connection request accepted')
      markAsRead(notificationId)
    } else {
      toast.error('Failed to accept connection request')
    }
  }, [acceptRequest, markAsRead])

  const handleIgnore = useCallback(async (notificationId: string) => {
    const success = await declineRequest(notificationId)
    if (success) {
      toast.success('Connection request declined')
      markAsRead(notificationId)
    } else {
      toast.error('Failed to decline connection request')
    }
  }, [declineRequest, markAsRead])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  if (isLoadingNotifications) {
    return (
      <div className="container max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Mobile Back Button */}
        <div className="md:hidden flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Stay updated with your network activity
              </p>
            </div>
          </div>

          {/* Header Actions */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Mobile Mark All Button */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="md:hidden w-full mt-3"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {NOTIFICATION_TABS.map((tab) => {
            const TabIcon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-11 px-4 text-sm font-medium gap-1.5",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Batch Actions Toolbar (when items selected) */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size} notification{selectedIds.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                selectedIds.forEach((id) => {
                  deleteNotification(id)
                })
                setSelectedIds(new Set())
                toast.success(`${selectedIds.size} notifications deleted`)
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <GlassCard innerClassName="text-center py-12 px-4">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No notifications
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {activeTab === "unread"
                ? "You're all caught up! No unread notifications."
                : "When you get notifications, they'll appear here"}
            </p>
          </GlassCard>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onAccept={() => handleAccept(notification.id)}
              onIgnore={() => handleIgnore(notification.id)}
              onDismiss={() => handleDismiss(notification.id)}
            />
          ))
        )}
      </div>

      {/* Footer Actions */}
      {displayNotifications.some((n) => n.read) && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleClearAllRead}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all read notifications
          </Button>
        </div>
      )}
    </div>
  )
}
