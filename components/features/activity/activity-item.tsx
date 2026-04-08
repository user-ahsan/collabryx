"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/shared/glass-card"
import { glass } from "@/lib/utils/glass-variants"
import type { ActivityFeedItem } from "@/hooks/use-activity-feed"
import { Eye, Users, Award } from "lucide-react"

interface ActivityItemProps {
  activity: ActivityFeedItem
}

const activityIcons = {
  profile_view: Eye,
  building_match: Users,
  skill_match: Award,
}

const activityLabels = {
  profile_view: "Viewed your profile",
  building_match: "Potential match",
  skill_match: "Skill match",
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const router = useRouter()
  const Icon = activityIcons[activity.type]
  
  const handleClick = () => {
    router.push(`/profile/${activity.actor.id}`)
  }

  const timeAgo = formatTimeAgo(activity.created_at)

  return (
    <GlassCard
      className={cn(
        "group transition-all hover:-translate-y-0.5 cursor-pointer",
        !activity.is_read ? "border-l-4 border-l-primary" : ""
      )}
      innerClassName="flex items-start gap-4 p-5"
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {activity.actor.avatar ? (
          /* eslint-disable @next/next/no-img-element */
          <img
            src={activity.actor.avatar}
            alt={activity.actor.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold backdrop-blur-sm",
            glass("badgeInfo")
          )}>
            {getInitials(activity.actor.name)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-0.5">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold text-foreground">{activity.actor.name}</span>{" "}
              <span className="text-muted-foreground">{activity.activity}</span>
            </p>
            {activity.actor.headline && (
              <p className="text-xs text-muted-foreground">{activity.actor.headline}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
        </div>

        {/* Match percentage badge for building_match and skill_match */}
        {activity.match_percentage && activity.type !== 'profile_view' && (
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm",
              activity.match_percentage >= 80 ? glass("badgeSuccess") :
              activity.match_percentage >= 60 ? glass("badgeWarning") :
              glass("badgeInfo")
            )}>
              {activity.match_percentage}% match
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {activityLabels[activity.type]}
            </span>
          </div>
        )}
      </div>

      {/* Icon badge */}
      <div className={cn(
        "mt-1 p-2 rounded-full shrink-0 backdrop-blur-sm",
        activity.type === "profile_view" && glass("badgeInfo"),
        activity.type === "building_match" && glass("badgeSuccess"),
        activity.type === "skill_match" && glass("badgeWarning")
      )}>
        <Icon className="h-4.5 w-4.5" />
      </div>
    </GlassCard>
  )
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
