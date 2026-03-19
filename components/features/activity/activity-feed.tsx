"use client"

import { useState } from "react"
import { ActivityItem } from "./activity-item"
import { useActivityFeed, type ActivityFeedItem } from "@/hooks/use-activity-feed"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { Bell } from "lucide-react"

interface ActivityFeedProps {
  initialLimit?: number
  showViewAll?: boolean
  onViewAllClick?: () => void
}

export function ActivityFeed({ 
  initialLimit = 5, 
  showViewAll = false,
  onViewAllClick 
}: ActivityFeedProps) {
  const [displayLimit, setDisplayLimit] = useState(initialLimit)
  
  const { data, isLoading, error } = useActivityFeed({ 
    limit: showViewAll ? 50 : displayLimit 
  })

  const activities = data?.data || []
  
  // Group activities by date
  const groupedActivities = groupActivitiesByDate(activities)
  
  const hasMore = showViewAll ? data?.hasMore : activities.length >= displayLimit

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 10)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} innerClassName="p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <GlassCard innerClassName="text-center py-12">
        <p className="text-destructive">Failed to load activity feed</p>
      </GlassCard>
    )
  }

  if (activities.length === 0) {
    return (
      <GlassCard innerClassName="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No activity yet</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grouped activities */}
      {Object.entries(groupedActivities).map(([group, items]) => (
        <div key={group} className="space-y-4">
          {/* Group header */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          {/* Activities */}
          <div className="space-y-4">
            {items.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}

      {/* Load more button */}
      {!showViewAll && hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLoadMore}
          >
            Load more
          </Button>
        </div>
      )}

      {/* View all link */}
      {showViewAll && onViewAllClick && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAllClick}
          >
            View all activity
          </Button>
        </div>
      )}
    </div>
  )
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function groupActivitiesByDate(activities: ActivityFeedItem[]): Record<string, ActivityFeedItem[]> {
  const groups: Record<string, ActivityFeedItem[]> = {}
  
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = addDays(today, -1)
  const thisWeek = addDays(today, -6)
  
  activities.forEach((activity) => {
    const activityDate = new Date(activity.created_at)
    let group: string
    
    if (isSameDay(activityDate, today)) {
      group = "Today"
    } else if (isSameDay(activityDate, yesterday)) {
      group = "Yesterday"
    } else if (activityDate >= thisWeek) {
      group = "This Week"
    } else {
      group = "Older"
    }
    
    if (!groups[group]) {
      groups[group] = []
    }
    
    groups[group].push(activity)
  })
  
  // Return groups in order
  const orderedGroups: Record<string, ActivityFeedItem[]> = {}
  const groupOrder = ["Today", "Yesterday", "This Week", "Older"]
  
  groupOrder.forEach((group) => {
    if (groups[group]) {
      orderedGroups[group] = groups[group]
    }
  })
  
  return orderedGroups
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
