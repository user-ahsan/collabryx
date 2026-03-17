"use client"

import { useState, useCallback, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Bell,
  Check,
  Trash2,
  X,
  CheckCheck,
  UserPlus,
  MessageSquare,
  Heart,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useUnreadCount,
  useRealtimeNotifications,
} from "@/hooks/use-notifications"
import type { NotificationWithActor } from "@/lib/services/notifications"
import {
  NOTIFICATION_TABS,
  getNotificationCategory,
  NOTIFICATION_TYPOGRAPHY,
  NOTIFICATION_SPACING,
  type NotificationType,
  type NotificationCategory,
} from "@/lib/constants/notifications"

interface NotificationsWidgetProps {
  children: React.ReactNode
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
  connect: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
  message: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
  like: 'bg-red-500/10 text-red-500 dark:text-red-400',
  comment: 'bg-purple-500/10 text-purple-500 dark:text-purple-400',
  match: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  system: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
}

function NotificationItem({
  notification,
  onAccept,
  onIgnore,
  onDismiss,
}: {
  notification: NotificationWithActor
  onAccept?: () => void
  onIgnore?: () => void
  onDismiss?: () => void
}) {
  const colors = NOTIFICATION_COLORS[notification.type as keyof typeof NOTIFICATION_COLORS] || NOTIFICATION_COLORS.system
  const Icon = NOTIFICATION_ICONS[notification.type as keyof typeof NOTIFICATION_ICONS] || Bell

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg transition-all duration-200",
          "hover:bg-muted/50 focus-within:bg-muted/50 hover:scale-[1.01]",
          !notification.is_read && "bg-muted/30 border-l-4 border-l-primary"
        )}
      >
        {/* Icon */}
        <div className={cn(
          "mt-0.5 p-2.5 rounded-full shrink-0 backdrop-blur-sm transition-colors",
          colors
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className={NOTIFICATION_TYPOGRAPHY.body}>
              <span className="font-semibold text-foreground">{notification.actor_name || 'Unknown'}</span>{" "}
              <span className="text-muted-foreground/80">{notification.content}</span>
            </p>
            <span className={NOTIFICATION_TYPOGRAPHY.timestamp}>
              {notification.time_ago}
            </span>
          </div>

          {/* Action Buttons for Connection Requests */}
          {notification.type === "connect" && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="h-9 px-4 text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  onAccept?.()
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-4 text-xs font-medium hover:bg-destructive/10 hover:text-destructive"
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

        {/* Dismiss Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 min-h-[44px] min-w-[44px] opacity-40 group-hover:opacity-100 group-focus-within:opacity-100",
            "transition-all duration-200 shrink-0 text-muted-foreground hover:text-destructive",
            "focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2",
            "hover:scale-110 active:scale-95"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.()
          }}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4 transition-transform duration-200" />
        </Button>
      </div>
    </motion.div>
  )
}

function NotificationList({
  activeTab,
  onDelete,
}: {
  activeTab: NotificationCategory
  onDelete: (id: string) => void
}) {
  const { data: notifications, isLoading, error } = useNotifications({ limit: 100 })
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const parentRef = useRef<HTMLDivElement>(null)

  // Filter notifications based on active tab
  const filteredNotifications = notifications?.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.is_read
    const category = getNotificationCategory(n.type as NotificationType)
    return category === activeTab
  }) || []

  // Virtual scrolling for performance
  const virtualizer = useVirtualizer({
    count: filteredNotifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimate each item is ~100px
    overscan: 3,
  })

  const handleAccept = useCallback((id: string) => {
    console.log("Accept connection:", id)
    toast.success("Connection accepted")
  }, [])

  const handleIgnore = useCallback((id: string) => {
    console.log("Ignore connection:", id)
    toast.success("Connection request ignored")
  }, [])

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

  if (isLoading) {
    return (
      <div className="space-y-3 p-4" aria-busy="true" aria-live="polite">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-4 animate-pulse">
            <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
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
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">
          Failed to load notifications
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px] mb-4">
          Something went wrong. Please try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className={cn("text-base", NOTIFICATION_TYPOGRAPHY.weightSemibold, NOTIFICATION_TYPOGRAPHY.title)}>
          No notifications
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          {activeTab === "unread"
            ? "You're all caught up!"
            : "When you get notifications, they'll appear here"}
        </p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto p-4 pb-6">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow, index) => {
          const notification = filteredNotifications[virtualRow.index]
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <NotificationItem
                notification={notification}
                onAccept={() => handleAccept(notification.id)}
                onIgnore={() => handleIgnore(notification.id)}
                onDismiss={() => onDelete(notification.id)}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function NotificationsWidget({
  children,
}: NotificationsWidgetProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all")
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const { data: unreadCount } = useUnreadCount()
  
  // Enable real-time updates
  useRealtimeNotifications()

  const deleteNotification = useDeleteNotification()

  const handleDelete = useCallback((id: string) => {
    // Optimistic update
    setDeletedIds(prev => new Set(prev).add(id))
    
    deleteNotification.mutate(id, {
      onSuccess: () => {
        toast.success("Notification deleted", {
          description: "You can undo this action",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              setDeletedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })
              toast.success("Notification restored")
            }
          }
        })
      },
      onError: () => {
        setDeletedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.error("Failed to delete notification", {
          description: "Please try again"
        })
      }
    })
  }, [deleteNotification])

  const handleClearAllRead = useCallback(() => {
    toast.success("Read notifications cleared")
  }, [])

  // Mobile: Full page navigation
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => window.location.href = "/notifications"}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount && unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            role="status"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
    )
  }

  // Desktop: Popover widget
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              role="status"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={16}
        avoidCollisions
        className="w-full min-w-[380px] max-w-[420px] max-h-[600px] p-0 bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl overflow-hidden rounded-xl z-[100]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg tracking-tight text-foreground">
              Notifications
            </h3>
            {unreadCount && unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-2 text-xs font-medium bg-primary text-primary-foreground"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => {
                // Mark all as read logic
                toast.success("All notifications marked as read", {
                  description: `${unreadCount} notifications cleared`
                })
              }}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-border/40 overflow-x-auto" role="tablist" aria-label="Notification filters">
          <div className="flex gap-1 p-2 min-w-max">
            {NOTIFICATION_TABS.map((tab) => {
              const TabIcon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs font-medium gap-1.5",
                    activeTab === tab.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[500px] w-full">
          <NotificationList
            activeTab={activeTab}
            onDelete={handleDelete}
          />
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/60 px-5 py-3 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-9 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearAllRead}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear all read notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
