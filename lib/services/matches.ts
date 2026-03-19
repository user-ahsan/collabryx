import { createClient } from "@/lib/supabase/client"
import type { MatchSuggestion, MatchActivity, MatchPreference } from "@/types/database.types"
import { executeOptimizedQuery } from "@/lib/database-optimization"
import { formatInitials } from "@/lib/utils/format-initials"
import { logger } from "@/lib/logger"

// ===========================================
// MATCH SUGGESTIONS SERVICE
// ===========================================

export interface MatchSuggestionWithProfile extends MatchSuggestion {
  matched_user_name?: string;
  matched_user_role?: string;
  matched_user_avatar?: string;
  matched_user_initials?: string;
}

export interface FetchMatchesOptions {
  limit?: number
  minPercentage?: number
  status?: MatchSuggestion["status"]
}

/**
 * Fetch match suggestions for the current user
 */
export async function fetchMatches(
  options: FetchMatchesOptions = {}
): Promise<{
  data: MatchSuggestionWithProfile[]
  error: Error | null
}> {
  // Define a local type for the raw Supabase response
  type RawMatch = {
    id: string
    user_id: string
    matched_user_id: string
    match_percentage: number
    reasons?: string[]
    ai_confidence?: number
    ai_explanation?: string
    status: "active" | "dismissed" | "connected"
    created_at: string
    expires_at?: string
    matched_user?: {
      full_name?: string
      display_name?: string
      avatar_url?: string
      headline?: string
    }
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    logger.app.error("Authentication failed", authError)
    return { data: [], error: new Error("Authentication failed. Please log in again.") }
  }

  if (!user) {
    return { data: [], error: new Error("Please log in to view matches.") }
  }

  const { data: queryData, error: queryError } = await executeOptimizedQuery(async () => {
    let query = supabase
      .from("match_suggestions")
      .select(`
        id,
        user_id,
        matched_user_id,
        match_percentage,
        reasons,
        ai_confidence,
        ai_explanation,
        status,
        created_at,
        expires_at,
        matched_user:profiles (
          full_name,
          display_name,
          avatar_url,
          headline
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("match_percentage", { ascending: false })
      .limit(options.limit || 20)

    if (options.minPercentage) {
      query = query.gte("match_percentage", options.minPercentage)
    }

    if (options.status) {
      query = query.eq("status", options.status)
    }

    const result = await query
    return result.data as unknown as RawMatch[]
  })

  // If there's an actual error, log and return it
  if (queryError) {
    logger.app.error("Failed to fetch matches", queryError)
    return { data: [], error: queryError }
  }
  
  // If no data but no error, it's not an error - just no matches
  if (!queryData || queryData.length === 0) {
    logger.app.warn("No matches found", { userId: user.id })
    return { data: [], error: null }
  }

  const mappedMatches: MatchSuggestionWithProfile[] = (queryData || []).map((match) => ({
    id: match.id,
    user_id: match.user_id,
    matched_user_id: match.matched_user_id,
    match_percentage: match.match_percentage,
    reasons: match.reasons || [],
    ai_confidence: match.ai_confidence,
    ai_explanation: match.ai_explanation,
    status: match.status,
    created_at: match.created_at,
    expires_at: match.expires_at,
    matched_user_name: match.matched_user?.display_name || match.matched_user?.full_name || "Unknown",
    matched_user_role: match.matched_user?.headline || "",
    matched_user_avatar: match.matched_user?.avatar_url || "",
    matched_user_initials: formatInitials(match.matched_user?.display_name || match.matched_user?.full_name || "Unknown"),
  }))

  return { data: mappedMatches, error: null }
}

/**
 * Dismiss a match suggestion
 */
export async function dismissMatch(matchId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.app.error("Authentication failed", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to dismiss matches.") }
    }

    const { error } = await supabase
      .from("match_suggestions")
      .update({ status: "dismissed" })
      .eq("id", matchId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    logger.app.error("Failed to dismiss match", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Connect with a match (creates a connection request)
 */
export async function connectWithMatch(matchedUserId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.app.error("Authentication failed", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to connect with matches.") }
    }

    // Create connection request
    const { error } = await supabase
      .from("connections")
      .insert({
        requester_id: user.id,
        receiver_id: matchedUserId,
        status: "pending",
      })

    if (error) throw error

    // Update match suggestion status
    await supabase
      .from("match_suggestions")
      .update({ status: "connected" })
      .eq("user_id", user.id)
      .eq("matched_user_id", matchedUserId)

    return { error: null }
  } catch (error) {
    logger.app.error("Failed to connect with match", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// MATCH ACTIVITY SERVICE
// ===========================================

export interface MatchActivityWithUser extends MatchActivity {
  user_name?: string;
  user_avatar?: string;
  user_initials?: string;
}

export async function fetchMatchActivity(
  options: { limit?: number } = {}
): Promise<{
  data: MatchActivityWithUser[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.app.error("Authentication failed in fetchMatchActivity", authError)
      return { 
        data: [], 
        error: new Error("Authentication failed: " + (authError?.message || "Not authenticated")) 
      }
    }

    let query = supabase
      .from("match_activity")
      .select(`
        *,
        actor:profiles (
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    const mappedActivities: MatchActivityWithUser[] = (data || []).map((activity) => ({
      id: activity.id,
      actor_user_id: activity.actor_user_id,
      target_user_id: activity.target_user_id,
      type: activity.type,
      activity: activity.activity,
      match_percentage: activity.match_percentage,
      is_read: activity.is_read,
      created_at: activity.created_at,
      user_name: activity.actor?.display_name || activity.actor?.full_name || "Unknown",
      user_avatar: activity.actor?.avatar_url || "",
      user_initials: formatInitials(activity.actor?.display_name || activity.actor?.full_name || "Unknown"),
    }))

    return { data: mappedActivities, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error)
    
    logger.app.error("Failed to fetch match activity", { 
      error: errorMessage 
    })
    return { data: [], error: new Error(errorMessage) }
  }
}

/**
 * Mark match activity as read
 */
export async function markActivityRead(activityId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    const { error } = await supabase
      .from("match_activity")
      .update({ is_read: true })
      .eq("id", activityId)
      .eq("target_user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    logger.app.error("Failed to mark activity as read", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// MATCH PREFERENCES SERVICE
// ===========================================

export async function fetchMatchPreferences(): Promise<{
  data: MatchPreference | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("match_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.app.error("Failed to fetch match preferences", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function updateMatchPreferences(
  preferences: Partial<MatchPreference>
): Promise<{ data: MatchPreference | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("match_preferences")
      .upsert({
        user_id: user.id,
        min_match_percentage: preferences.min_match_percentage,
        interested_in_types: preferences.interested_in_types,
        availability_match: preferences.availability_match,
      }, { onConflict: "user_id" })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.app.error("Failed to update match preferences", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}




