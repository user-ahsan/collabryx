/**
 * Analytics Dashboard Page
 * 
 * Full analytics dashboard for profile performance tracking
 */

"use client"

import { useState } from "react"
import { ProfileAnalytics } from "@/components/features/analytics/profile-analytics"
import { AnalyticsChart } from "@/components/features/analytics/analytics-chart"
import { useAnalyticsDashboard, useExportAnalytics } from "@/hooks/use-analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, RefreshCw, BarChart3 } from "lucide-react"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  const { analytics, activity, isLoading, error, refetch } = useAnalyticsDashboard(timeRange)
  const exportMutation = useExportAnalytics()

  const handleExport = () => {
    if (analytics && activity) {
      exportMutation.mutate(
        {
          analytics,
          activity,
          filename: `analytics-${timeRange}days`,
        },
        {
          onSuccess: () => {
            toast.success("Analytics exported successfully")
          },
          onError: () => {
            toast.error("Failed to export analytics")
          },
        }
      )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track your profile performance and engagement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isLoading || !analytics || !activity}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            <ProfileAnalytics analytics={analytics || undefined} isLoading={isLoading} />
          </section>

          {/* Activity Chart */}
          <section>
            <AnalyticsChart
              activity={activity}
              isLoading={isLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </section>

          {/* Additional Insights */}
          {!isLoading && analytics && (
            <section className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Content Performance</CardTitle>
                  <CardDescription>Your content impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posts Created</span>
                    <span className="font-medium">{analytics.posts_created_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Post Impressions</span>
                    <span className="font-medium">{analytics.post_impressions_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reactions Received</span>
                    <span className="font-medium">{analytics.post_reactions_received || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comments Received</span>
                    <span className="font-medium">{analytics.post_comments_received || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Activity</CardTitle>
                  <CardDescription>Your connections and messaging</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Connections</span>
                    <span className="font-medium">{analytics.connections_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversations</span>
                    <span className="font-medium">{analytics.conversations_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages Sent</span>
                    <span className="font-medium">{analytics.messages_sent_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages Received</span>
                    <span className="font-medium">{analytics.messages_received_count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
