/**
 * Match Generation Service
 * Interfaces with Python worker for AI-powered match generation
 */

import { logger } from "@/lib/logger"
import { TOAST_MESSAGES } from "@/lib/constants/toast-messages"
import { toast } from "sonner"

const PYTHON_WORKER_URL = process.env.NEXT_PUBLIC_PYTHON_WORKER_URL || "http://localhost:8000"

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
 * Generate matches for a single user
 * Calls Python worker /api/matches/generate endpoint
 */
export async function generateMatches(
  userId: string,
  limit: number = 20
): Promise<{ data: MatchGenerationResult | null; error: Error | null }> {
  try {
    const response = await fetch(`${PYTHON_WORKER_URL}/api/matches/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        limit,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 429) {
        const resetAt = errorData.detail?.reset_at
        throw new Error(
          `Rate limit exceeded. Please try again ${resetAt ? `after ${resetAt}` : "later"}`
        )
      }

      throw new Error(errorData.detail || `Failed to generate matches: ${response.statusText}`)
    }

    const data: MatchGenerationResult = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    toast.success(TOAST_MESSAGES.SUCCESS("Match generation"), {
      description: `Generated ${data.suggestions_created} match suggestions`,
    })

    logger.app.info(`Match generation successful for user ${userId}`, {
      suggestions_created: data.suggestions_created,
    })

    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate matches"
    
    logger.app.error("Match generation failed", error as Error)
    
    toast.error(TOAST_MESSAGES.ERROR("generate matches"), {
      description: errorMessage,
    })

    return { data: null, error: error instanceof Error ? error : new Error(errorMessage) }
  }
}

/**
 * Generate matches for multiple users in batch
 * Calls Python worker /api/matches/generate/batch endpoint
 */
export async function generateBatchMatches(
  userIds?: string[],
  limitPerUser: number = 20
): Promise<{ data: { status: string; message: string; users_count?: number; processed_count?: number } | null; error: Error | null }> {
  try {
    const response = await fetch(`${PYTHON_WORKER_URL}/api/matches/generate/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    toast.success(TOAST_MESSAGES.SUCCESS("Batch match generation"), {
      description: data.message || "Batch processing started",
    })

    logger.app.info("Batch match generation started", {
      users_count: data.users_count || data.processed_count,
      limit_per_user: limitPerUser,
    })

    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to start batch generation"
    
    logger.app.error("Batch match generation failed", error as Error)
    
    toast.error(TOAST_MESSAGES.ERROR("start batch generation"), {
      description: errorMessage,
    })

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
