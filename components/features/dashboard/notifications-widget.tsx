"use client"

import { useState, useCallback } from "react"
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
} from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import {
  NOTIFICATION_TABS,
  getNotificationColorClasses,
  getNotificationIcon,
  getNotificationCategory,
  type NotificationType,
  type NotificationCategory,
} from "@/lib/constants/notifications"

interface Notification {
  id: string
  type: NotificationType
  actor: { name: string; avatar: string }
  content: string
  time: string
  read: boolean
  resourceType?: 'post' | 'profile' | 'conversation' | 'match'
  resourceId?: string
}

interface NotificationsWidgetProps {
  children: React.ReactNode
  initialNotifications?: Notification[]
}

// Mock data - replace with actual data from useNotifications hook
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "connect",
    actor: { name: "David Kim", avatar: "/avatars/04.png" },
    content: "sent you a connection request",
    time: "2m ago",
    read: false,
    resourceType: "profile",
    resourceId: "user-123",
  },
  {
    id: "2",
    type: "message",
    actor: { name: "Sarah Chen", avatar: "/avatars/01.png" },
    content: "messaged you: 'Hey! I saw your profile...'",
    time: "1h ago",
    read: false,
    resourceType: "conversation",
    resourceId: "conv-456",
  },
  {
    id: "3",
    type: "like",
    actor: { name: "Alex Rivera", avatar: "/avatars/02.png" },
    content: "liked your project 'AI Generator'",
    time: "3h ago",
    read: true,
    resourceType: "post",
    resourceId: "post-789",
  },
  {
    id: "4",
    type: "match",
    actor: { name: "Emma Wilson", avatar: "/avatars/03.png" },
    content: "is a 95% match with your profile!",
    time: "5h ago",
    read: false,
    resourceType: "match",
    resourceId: "match-321",
  },
  {
    id: "5",
    type: "comment",
    actor: { name: "John Doe", avatar: "/avatars/05.png" },
    content: "commented on your post",
    time: "1d ago",
    read: true,
    resourceType: "post",
    resourceId: "post-789",
  },
  {
    id: "6",
    type: "achievement",
    actor: { name: "Collabryx", avatar: "" },
    content: "You earned the 'Early Adopter' badge!",
    time: "2d ago",
    read: true,
  },
  {
    id: "7",
    type: "system",
    actor: { name: "Collabryx", avatar: "" },
    content: "Your profile is getting attention! 5 new views this week",
    time: "3d ago",
    read: true,
  },
]

function NotificationItem({
  notification,
  onAccept,
  onIgnore,
  onDismiss,
}: {
  notification: Notification
  onAccept?: () => void
  onIgnore?: () => void
  onDismiss?: () => void
}) {
  const colors = getNotificationColorClasses(notification.type)
  const Icon = getNotificationIcon(notification.type)

  return (
    <GlassCard
      hoverable
      className={cn(
        "group transition-all duration-300",
        !notification.read && "border-l-4 border-l-primary shadow-[0_0_15px_rgba(59,130,246,0.08)]"
      )}
      innerClassName="flex items-start gap-4 p-4"
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 p-2.5 rounded-full shrink-0 backdrop-blur-sm transition-colors",
        colors.bg,
        colors.text,
        colors.darkText
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm leading-relaxed">
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

      {/* Dismiss Button (hover only) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss?.()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </GlassCard>
  )
}

function NotificationList({
  notifications,
  activeTab,
}: {
  notifications: Notification[]
  activeTab: NotificationCategory
}) {
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    const category = getNotificationCategory(n.type)
    return category === activeTab
  })

  const handleAccept = useCallback((id: string) => {
    console.log("Accept connection:", id)
    // TODO: Implement accept logic
  }, [])

  const handleIgnore = useCallback((id: string) => {
    console.log("Ignore connection:", id)
    // TODO: Implement ignore logic
  }, [])

  const handleDismiss = useCallback((id: string) => {
    console.log("Dismiss notification:", id)
    // TODO: Implement dismiss logic
  }, [])

  return (
    <ScrollArea className="flex-1 overflow-y-auto w-full">
      <div className="space-y-2 p-4 pb-6 min-h-[400px]">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              No notifications
            </h3>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              {activeTab === "unread"
                ? "You're all caught up!"
                : "When you get notifications, they'll appear here"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onAccept={() => handleAccept(notification.id)}
              onIgnore={() => handleIgnore(notification.id)}
              onDismiss={() => handleDismiss(notification.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  )
}

export function NotificationsWidget({
  children,
  initialNotifications = MOCK_NOTIFICATIONS,
}: NotificationsWidgetProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all")
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const handleClearAllRead = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read))
  }, [])

  // Mobile: Full page navigation
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => window.location.href = "/notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
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
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
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
        className="w-[400px] max-h-[600px] p-0 bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl overflow-hidden rounded-xl z-[100]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg tracking-tight text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-2 text-xs font-medium bg-primary text-primary-foreground"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-border/40 overflow-x-auto">
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
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Notification List */}
        <div className="h-[500px] flex flex-col">
          <NotificationList
            notifications={notifications}
            activeTab={activeTab}
          />
        </div>

        {/* Footer */}
        {notifications.some((n) => n.read) && (
          <div className="border-t border-border/60 px-5 py-3 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClearAllRead}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear all read notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
