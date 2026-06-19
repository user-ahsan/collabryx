import { createClient } from "@/lib/supabase/client"
import type { MatchSuggestion, MatchActivity, MatchPreference } from "@/types/database.types"
import { executeOptimizedQuery } from "@/lib/database-optimization"
import { formatInitials } from "@/lib/utils/format-initials"
import { logger } from "@/lib/logger"
import { trackDatabaseOperation } from "@/lib/database-connection-manager"

// ===========================================
// MATCH SUGGESTIONS SERVICE
// ===========================================

export interface MatchSuggestionWithProfile extends MatchSuggestion {
  matched_user_name?: string;
  matched_user_role?: string;
  matched_user_avatar?: string;
  matched_user_initials?: string;
  matched_user_bio?: string;
  matched_user_location?: string;
  matched_user_collaboration?: string;
  matched_user_skills?: string[];
  matched_user_interests?: string[];
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
      bio?: string
      location?: string
      collaboration_readiness?: string
      roles?: string[]
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

  logger.app.info("Fetching matches", {
    userId: user.id,
    limit: options.limit || 20,
    minPercentage: options.minPercentage,
  })

  const { data: queryData, error: queryError } = await executeOptimizedQuery(
    async () => {
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
          matched_user:profiles!match_suggestions_matched_user_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url,
            headline,
            bio,
            location,
            collaboration_readiness,
            roles
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
    },
    {
      operationName: 'fetchMatches',
      maxRetries: 3,
      timeout: 15000, // 15 second timeout for match queries
    }
  )

  // If there's an actual error, log the FULL details and return it
  if (queryError) {
    logger.app.error("Failed to fetch matches", {
      errorMessage: queryError.message,
      errorCode: (queryError as unknown as Record<string, unknown>).code,
      errorDetails: (queryError as unknown as Record<string, unknown>).details,
      errorHint: (queryError as unknown as Record<string, unknown>).hint,
      userId: user.id,
    })
    trackDatabaseOperation(false, queryError)
    return { data: [], error: queryError }
  }
  
  trackDatabaseOperation(true)
  
  // If no data but no error, it's expected for new users — log at info, not warn
  if (!queryData || queryData.length === 0) {
    logger.app.info("No matches found — new user or no compatible matches yet", {
      userId: user.id,
    })
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
    matched_user_bio: match.matched_user?.bio || "",
    matched_user_location: match.matched_user?.location || "",
    matched_user_collaboration: match.matched_user?.collaboration_readiness || "available",
    matched_user_skills: [],
    matched_user_interests: [],
    matched_user_roles: match.matched_user?.roles || [],
  }))

  const matchedUserIds = mappedMatches.map((m) => m.matched_user_id)

  const { data: skillsData } = await supabase
    .from("user_skills")
    .select("user_id, skill_name")
    .in("user_id", matchedUserIds)

  const { data: interestsData } = await supabase
    .from("user_interests")
    .select("user_id, interest")
    .in("user_id", matchedUserIds)

  if (skillsData) {
    const skillsMap = new Map<string, string[]>()
    for (const row of skillsData) {
      if (!skillsMap.has(row.user_id)) skillsMap.set(row.user_id, [])
      skillsMap.get(row.user_id)!.push(row.skill_name)
    }
    for (const match of mappedMatches) {
      match.matched_user_skills = skillsMap.get(match.matched_user_id) || []
    }
  }

  if (interestsData) {
    const interestsMap = new Map<string, string[]>()
    for (const row of interestsData) {
      if (!interestsMap.has(row.user_id)) interestsMap.set(row.user_id, [])
      interestsMap.get(row.user_id)!.push(row.interest)
    }
    for (const match of mappedMatches) {
      match.matched_user_interests = interestsMap.get(match.matched_user_id) || []
    }
  }

  logger.app.info("Matches fetched successfully", {
    count: mappedMatches.length,
    userId: user.id,
  })

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
 * Uses transaction-like pattern to ensure atomicity
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

    // Atomic RPC call: creates pending connection request and marks match suggestion status as connected
    const { error: rpcError } = await supabase
      .rpc("connect_with_match", {
        p_user_id: user.id,
        p_matched_user_id: matchedUserId,
      })

    if (rpcError) {
      logger.app.error("Failed to connect with match via RPC", {
        error: rpcError.message,
        matchedUserId,
      })
      throw rpcError
    }

    return { error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect with match"
    logger.app.error("Failed to connect with match", {
      error: message,
      matchedUserId,
    })
    return { error: new Error(message) }
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

    // Use explicit foreign key constraint name for the join
    let query = supabase
      .from("match_activity")
      .select(`
        id,
        actor_user_id,
        target_user_id,
        type,
        activity,
        match_percentage,
        is_read,
        created_at,
        actor_profile:profiles!match_activity_actor_user_id_fkey (
          id,
          full_name,
          display_name,
          avatar_url,
          headline
        )
      `)
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.app.error("Match activity query failed", {
        error: error.message,
        userId: user.id,
      })
      throw error
    }

    const mappedActivities: MatchActivityWithUser[] = (data || []).map((activity) => {
      const actorProfile = activity.actor_profile?.[0]
      return {
        id: activity.id,
        actor_user_id: activity.actor_user_id,
        target_user_id: activity.target_user_id,
        type: activity.type,
        activity: activity.activity,
        match_percentage: activity.match_percentage,
        is_read: activity.is_read,
        created_at: activity.created_at,
        user_name: actorProfile?.display_name || actorProfile?.full_name || "Unknown",
        user_avatar: actorProfile?.avatar_url || "",
        user_initials: formatInitials(actorProfile?.display_name || actorProfile?.full_name || "Unknown"),
      }
    })

    logger.app.info("Match activity fetched successfully", {
      count: mappedActivities.length,
      userId: user.id,
    })

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: new Error(authError?.message || "Not authenticated") }
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
      .select("id, user_id, min_match_percentage, interested_in_types, availability_match, created_at, updated_at")
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
      .select('id, user_id, min_match_percentage, interested_in_types, availability_match, created_at, updated_at')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.app.error("Failed to update match preferences", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}




