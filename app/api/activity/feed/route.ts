import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

/**
 * GET /api/activity/feed
 * Fetch activity feed for the current user
 * 
 * Query params:
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Fetch match activity with related user data
    const { data: activities, error: queryError, count } = await supabase
      .from("match_activity")
      .select(`
        *,
        actor_profile:profiles!match_activity_actor_user_id_fkey (
          id,
          display_name,
          full_name,
          avatar_url,
          headline
        )
      `, { count: 'exact' })
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (queryError) {
      logger.app.error("Error fetching activity feed", queryError)
      return NextResponse.json(
        { error: "Failed to fetch activity feed" },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedActivities = (activities || []).map((activity: {
      id: string
      type: string
      activity: string
      match_percentage?: number
      created_at: string
      is_read: boolean
      actor_user_id: string
      actor_profile?: {
        id: string
        display_name?: string
        full_name?: string
        avatar_url?: string
        headline?: string
      }
    }) => ({
      id: activity.id,
      type: activity.type,
      activity: activity.activity,
      match_percentage: activity.match_percentage,
      created_at: activity.created_at,
      is_read: activity.is_read,
      actor: {
        id: activity.actor_profile?.id || activity.actor_user_id,
        name: activity.actor_profile?.display_name || activity.actor_profile?.full_name || "Unknown User",
        avatar: activity.actor_profile?.avatar_url || null,
        headline: activity.actor_profile?.headline || null,
      },
    }))

    return NextResponse.json({
      data: transformedActivities,
      count: count || 0,
      hasMore: offset + limit < (count || 0),
    })
  } catch (error) {
    logger.app.error("Error in activity feed API", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
