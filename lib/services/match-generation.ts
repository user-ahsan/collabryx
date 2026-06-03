/**
 * Match Generation Service
 * Calls the Next.js API route which uses the native pgvector match generator
 */

import { logger } from "@/lib/logger"

/** Read CSRF token from the double-submit cookie (httpOnly: false) */
function getCSRFToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match?.[1] ?? ""
}

function csrfHeaders(): Record<string, string> {
  const token = getCSRFToken()
  return token ? { "X-CSRF-Token": token } : {}
}

export interface MatchGenerationResult {
  suggestions_created: number
  matches: Array<{
    id: string
    user_id: string
    matched_user_id: string
    match_percentage: number
    reasons: string[]
    ai_confidence?: number
    ai_explanation?: string
    status: "active" | "dismissed" | "connected"
    created_at: string
    expires_at?: string
  }>
  error?: string
}

export interface MatchGenerationStatus {
  status: "queued" | "processing" | "completed" | "failed"
  suggestions_created?: number
  error?: string
  message?: string
}

/**
 * Generate matches for a single user via the Next.js /api/matches/generate route.
 * This uses the native pgvector match generator — no Python worker needed.
 */
export async function generateMatches(
  userId: string,
  limit: number = 20
): Promise<{ data: MatchGenerationResult | null; error: Error | null }> {
  try {
    const response = await fetch("/api/matches/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders(),
      },
      body: JSON.stringify({
        user_id: userId,
        limit,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // API returns { error: { code, message } } — extract message string, not the object
      const detail = typeof errorData.error === "object"
        ? errorData.error?.message || errorData.error?.code || JSON.stringify(errorData.error)
        : errorData.error || errorData.message || `HTTP ${response.status}`

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please try again later.`)
      }
      if (response.status === 400 && errorData.error?.code === "EMBEDDING_NOT_READY") {
        throw new Error("Your profile embedding is still being generated. Please wait a moment and try again.")
      }
      if (response.status === 400 && errorData.error?.code === "ONBOARDING_INCOMPLETE") {
        throw new Error("Please complete your profile before generating matches.")
      }

      throw new Error(detail)
    }

    const result = await response.json()
    const data: MatchGenerationResult = {
      suggestions_created: result.data?.matches_generated ?? 0,
      matches: (result.data?.suggestions ?? []).map((s: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        matched_user_id: s.matched_user_id as string,
        match_percentage: s.match_percentage as number,
        reasons: s.reasons as string[],
        ai_confidence: s.ai_confidence as number | undefined,
        status: "active" as const,
        created_at: new Date().toISOString(),
      })),
    }

    logger.app.info(`Match generation successful for user ${userId}`, {
      suggestions_created: data.suggestions_created,
    })

    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate matches"

    logger.app.error("Match generation failed", error as Error)

    return { data: null, error: error instanceof Error ? error : new Error(errorMessage) }
  }
}

/**
 * Generate matches for multiple users via the Next.js batch API route
 */
export async function generateBatchMatches(
  userIds?: string[],
  limitPerUser: number = 20
): Promise<{ data: { status: string; message: string; users_count?: number; processed_count?: number } | null; error: Error | null }> {
  try {
    const response = await fetch("/api/matches/generate/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders(),
      },
      body: JSON.stringify({
        user_ids: userIds,
        limit_per_user: limitPerUser,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to start batch generation: ${response.statusText}`)
    }

    const data = await response.json()

    logger.app.info("Batch match generation started", {
      users_count: data.users_count || data.processed_count,
      limit_per_user: limitPerUser,
    })

    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to start batch generation"
    
    logger.app.error("Batch match generation failed", error as Error)

    return { data: null, error: error instanceof Error ? error : new Error(errorMessage) }
  }
}

/**
 * Check match generation status for a user
 * Queries profile_embeddings table for status
 */
export async function checkMatchGenerationStatus(
  userId: string
): Promise<{ data: MatchGenerationStatus | null; error: Error | null }> {
  try {
    // Import dynamically to avoid circular dependencies
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()

    // Check if user has embeddings (prerequisite for match generation)
    const { data: embeddingData, error: embeddingError } = await supabase
      .from("profile_embeddings")
      .select("status, last_updated, error_message")
      .eq("user_id", userId)
      .single()

    if (embeddingError && embeddingError.code !== "PGRST116") {
      throw embeddingError
    }

    // Check for recent match suggestions
    const { data: matchData, error: matchError } = await supabase
      .from("match_suggestions")
      .select("id, created_at, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    if (matchError) {
      throw matchError
    }

    // Determine status based on data
    let status: MatchGenerationStatus

    if (!embeddingData) {
      status = {
        status: "queued",
        message: "Profile embedding not yet generated. Please complete your profile.",
      }
    } else if (embeddingData.status === "failed") {
      status = {
        status: "failed",
        error: embeddingData.error_message || "Embedding generation failed",
      }
    } else if (matchData && matchData.length > 0) {
      status = {
        status: "completed",
        suggestions_created: matchData.length,
        message: `${matchData.length} match suggestions available`,
      }
    } else {
      status = {
        status: "processing",
        message: "Generating match suggestions...",
      }
    }

    return { data: status, error: null }
  } catch (error) {
    logger.app.error("Failed to check match generation status", error as Error)
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to check status"),
    }
  }
}
