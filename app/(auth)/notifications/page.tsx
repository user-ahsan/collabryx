"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/shared/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
} from "lucide-react"
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

// Mock data - replace with useNotifications hook
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

function NotificationListItem({
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
      innerClassName="flex items-start gap-4 p-4 md:p-6"
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 p-3 rounded-full shrink-0 backdrop-blur-sm transition-colors",
        colors.bg,
        colors.text,
        colors.darkText
      )}>
        <Icon className="h-5 w-5" />
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
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    const category = getNotificationCategory(n.type)
    return category === activeTab
  })

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const handleClearAllRead = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read))
  }, [])

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleAccept = useCallback((id: string) => {
    console.log("Accept connection:", id)
    // TODO: Implement accept logic
  }, [])

  const handleIgnore = useCallback((id: string) => {
    console.log("Ignore connection:", id)
    // TODO: Implement ignore logic
  }, [])

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
                setNotifications((prev) =>
                  prev.filter((n) => !selectedIds.has(n.id))
                )
                setSelectedIds(new Set())
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
      {notifications.some((n) => n.read) && (
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
