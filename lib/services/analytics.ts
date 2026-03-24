/**
 * Analytics Service - Supabase queries for user analytics
 * 
 * Provides typed analytics data fetching for profile performance metrics
 */

import { createClient } from "@/lib/supabase/client"
import type { UserAnalytics, AnalyticsActivityData as ActivityData } from "@/types/database.types"
import { logger } from "@/lib/logger"

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export type UserAnalyticsData = UserAnalytics

export type AnalyticsActivityData = ActivityData

export interface AnalyticsTimeRange {
  days: 7 | 30 | 90
  label: string
}

export const TIME_RANGES: AnalyticsTimeRange[] = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
]

// ===========================================
// ANALYTICS SERVICE
// ===========================================

/**
 * Fetch user analytics data
 */
export async function fetchUserAnalytics(): Promise<{
  data: UserAnalyticsData | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.app.error("Authentication failed", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to view analytics.") }
    }

    const { data, error } = await supabase
      .from("user_analytics")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No analytics data yet, return defaults
        return {
          data: {
            user_id: user.id,
            profile_views_count: 0,
            profile_views_last_7_days: 0,
            profile_views_last_30_days: 0,
            post_impressions_count: 0,
            post_reactions_received: 0,
            post_comments_received: 0,
            posts_created_count: 0,
            match_suggestions_count: 0,
            matches_accepted_count: 0,
            match_acceptance_rate: 0,
            high_confidence_matches_count: 0,
            connections_count: 0,
            connection_requests_sent: 0,
            connection_requests_received: 0,
            mutual_connections_avg: 0,
            messages_sent_count: 0,
            messages_received_count: 0,
            conversations_count: 0,
            avg_response_time_minutes: 0,
            ai_sessions_count: 0,
            ai_messages_count: 0,
            sessions_count: 0,
            total_time_spent_minutes: 0,
            engagement_score: 0,
            influence_score: 0,
            activity_streak_days: 0,
            last_active: undefined,
            last_active_ip: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }
      }
      throw error
    }

    return { data, error: null }
  } catch (error) {
    logger.app.error("Failed to fetch user analytics", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch activity data for chart visualization
 */
export async function fetchAnalyticsActivity(
  days: 7 | 30 | 90 = 30
): Promise<{
  data: AnalyticsActivityData[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.app.error("Authentication failed", authError)
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: [], error: new Error("Please log in to view analytics.") }
    }

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch activity data from events table
    const { data, error } = await supabase
      .from("events")
      .select("event_type, created_at")
      .eq("actor_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

    // Aggregate data by day
    const aggregatedData = aggregateActivityByDay(data || [], days)

    return { data: aggregatedData, error: null }
  } catch (error) {
    logger.app.error("Failed to fetch analytics activity", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Aggregate event data by day
 */
function aggregateActivityByDay(
  events: Array<{ event_type: string; created_at: string }>,
  days: number
): AnalyticsActivityData[] {
  const result: AnalyticsActivityData[] = []
  const now = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Initialize all days with zero values
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    result.push({
      date: dateStr,
      profile_views: 0,
      matches: 0,
      connections: 0,
      posts: 0,
    })
  }

  // Aggregate events
  events.forEach((event) => {
    const dateStr = event.created_at.split("T")[0]
    const dayData = result.find((d) => d.date === dateStr)

    if (dayData) {
      switch (event.event_type) {
        case "profile_view":
          dayData.profile_views += 1
          break
        case "match_accepted":
        case "match_created":
          dayData.matches += 1
          break
        case "connection_accepted":
        case "connection_requested":
          dayData.connections += 1
          break
        case "post_created":
          dayData.posts += 1
          break
      }
    }
  })

  return result
}

/**
 * Calculate engagement score from analytics data
 */
export function calculateEngagementScore(analytics: UserAnalyticsData): number {
  let score = 0

  // Profile completeness (25%)
  score += Math.min(analytics.profile_views_count / 10, 1) * 25

  // Match activity (25%)
  score += Math.min(analytics.matches_accepted_count / 5, 1) * 25

  // Connection activity (25%)
  score += Math.min(analytics.connections_count / 10, 1) * 25

  // Content engagement (25%)
  score += Math.min(analytics.post_reactions_received / 20, 1) * 25

  return Math.round(score)
}

/**
 * Export analytics data as CSV
 */
export function exportAnalyticsToCSV(analytics: UserAnalyticsData, activity: AnalyticsActivityData[]): string {
  const csvRows: string[] = []

  // Summary header
  csvRows.push("Profile Analytics Summary")
  csvRows.push("Metric,Value")
  csvRows.push(`Profile Views (Total),${analytics.profile_views_count}`)
  csvRows.push(`Profile Views (Last 7 Days),${analytics.profile_views_last_7_days}`)
  csvRows.push(`Profile Views (Last 30 Days),${analytics.profile_views_last_30_days}`)
  csvRows.push(`Match Acceptance Rate,${analytics.match_acceptance_rate}%`)
  csvRows.push(`Connections,${analytics.connections_count}`)
  csvRows.push(`Engagement Score,${analytics.engagement_score}`)
  csvRows.push(`Influence Score,${analytics.influence_score}`)
  csvRows.push("")

  // Activity data header
  csvRows.push("Daily Activity")
  csvRows.push("Date,Profile Views,Matches,Connections,Posts")

  activity.forEach((day) => {
    csvRows.push(`${day.date},${day.profile_views},${day.matches},${day.connections},${day.posts}`)
  })

  return csvRows.join("\n")
}
