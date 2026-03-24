"use client"

import { Bell } from "lucide-react"
import { useUnreadCount } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface NotificationBellProps {
  onClick?: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: unreadCount, isLoading } = useUnreadCount()
  const hasUnread = unreadCount && unreadCount > 0
  const [previousCount, setPreviousCount] = useState(0)
  const [announcement, setAnnouncement] = useState("")

  // Announce count changes to screen readers
  useEffect(() => {
    if (unreadCount !== undefined && unreadCount !== previousCount) {
      if (unreadCount > previousCount) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnnouncement(`${unreadCount - previousCount} new notification${unreadCount - previousCount > 1 ? 's' : ''}`)
      }
       
      setPreviousCount(unreadCount)
    }
  }, [unreadCount, previousCount])

  return (
    <>
      {/* Screen reader announcement */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      <button
        onClick={onClick}
        className={cn(
          "relative p-2 rounded-full transition-colors duration-200",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={false}
        disabled={isLoading}
      >
        <Bell className="h-5 w-5 text-foreground" />
        
        {hasUnread && (
          <span
            className={cn(
              "absolute top-1 right-1 min-w-[20px] h-[20px] px-1.5",
              "flex items-center justify-center",
              "bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full",
              "animate-in zoom-in duration-200",
              "border-2 border-background"
            )}
            role="status"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
