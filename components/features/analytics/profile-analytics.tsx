/**
 * Profile Analytics Component
 * 
 * Displays key profile performance metrics
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Eye, Target, Activity, Zap } from "lucide-react"
import type { UserAnalytics } from "@/types/database.types"

interface ProfileAnalyticsProps {
  analytics?: UserAnalytics | null
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: number | string
  description?: string | React.ReactNode
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  isLoading?: boolean
}

function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
            {trend && (
              <span
                className={`ml-2 ${
                  trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                    ? "text-red-600"
                    : ""
                }`}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ProfileAnalytics({ analytics, isLoading }: ProfileAnalyticsProps) {
  if (!analytics && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>
            Start engaging with the platform to see your profile performance metrics
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const matchRate = analytics?.match_acceptance_rate?.toFixed(1) || "0"
  const connectionRate =
    analytics?.connections_count && analytics?.connection_requests_sent
      ? ((analytics.connections_count / analytics.connection_requests_sent) * 100).toFixed(1)
      : "0"

  const engagementScore = analytics?.engagement_score || 0
  const influenceScore = analytics?.influence_score || 0

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", variant: "default" as const }
    if (score >= 60) return { label: "Good", variant: "default" as const }
    if (score >= 40) return { label: "Moderate", variant: "secondary" as const }
    return { label: "Low", variant: "secondary" as const }
  }

  const engagementLevel = getEngagementLevel(engagementScore)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Profile Views */}
      <MetricCard
        title="Profile Views"
        value={analytics?.profile_views_last_7_days || 0}
        description={`Last 7 days (Total: ${analytics?.profile_views_count || 0})`}
        icon={<Eye className="h-4 w-4" />}
        trend={
          analytics && analytics.profile_views_last_7_days > analytics.profile_views_last_30_days / 4
            ? "up"
            : "neutral"
        }
        isLoading={isLoading}
      />

      {/* Match Rate */}
      <MetricCard
        title="Match Rate"
        value={`${matchRate}%`}
        description={`${analytics?.matches_accepted_count || 0} accepted matches`}
        icon={<Target className="h-4 w-4" />}
        trend="neutral"
        isLoading={isLoading}
      />

      {/* Connection Acceptance Rate */}
      <MetricCard
        title="Connection Rate"
        value={`${connectionRate}%`}
        description={`${analytics?.connections_count || 0} total connections`}
        icon={<Users className="h-4 w-4" />}
        trend={analytics && analytics.connections_count > 5 ? "up" : "neutral"}
        isLoading={isLoading}
      />

      {/* Engagement Score */}
      <MetricCard
        title="Engagement Score"
        value={engagementScore.toString()}
        description={
          <div className="flex items-center gap-1">
            Level:{" "}
            <Badge variant={engagementLevel.variant} className="text-xs">
              {engagementLevel.label}
            </Badge>
          </div>
        }
        icon={<Activity className="h-4 w-4" />}
        trend={engagementScore >= 60 ? "up" : "neutral"}
        isLoading={isLoading}
      />

      {/* Influence Score */}
      <MetricCard
        title="Influence Score"
        value={influenceScore.toString()}
        description="Based on network & activity"
        icon={<TrendingUp className="h-4 w-4" />}
        trend={influenceScore >= 50 ? "up" : "neutral"}
        isLoading={isLoading}
      />

      {/* Activity Streak */}
      <MetricCard
        title="Activity Streak"
        value={`${analytics?.activity_streak_days || 0} days`}
        description={
          analytics && analytics.activity_streak_days >= 7
            ? "🔥 On fire!"
            : "Keep engaging daily"
        }
        icon={<Zap className="h-4 w-4" />}
        trend={analytics && analytics.activity_streak_days >= 7 ? "up" : "neutral"}
        isLoading={isLoading}
      />
    </div>
  )
}
