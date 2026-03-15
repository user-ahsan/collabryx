"use client"

import { Bell } from "lucide-react"
import { useUnreadCount } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  onClick?: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: unreadCount } = useUnreadCount()
  const hasUnread = unreadCount && unreadCount > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-full transition-colors",
        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
      )}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-foreground" />
      
      {hasUnread && (
        <span
          className={cn(
            "absolute top-1 right-1 min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "bg-red-500 text-white text-[10px] font-bold rounded-full",
            "animate-in zoom-in duration-200"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
