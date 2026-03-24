/**
 * Embedding Service
 * Handles vector embedding generation and status tracking for user profiles
 */

import { createClient } from "@/lib/supabase/client";

export class RateLimitError extends Error {
  retryAfter: number;
  resetAt: string;
  remaining: number;

  constructor(message: string, retryAfter: number, resetAt: string, remaining: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetAt = resetAt;
    this.remaining = remaining;
  }
}

export interface EmbeddingStatus {
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_updated: string;
  embedding?: number[];
}

export interface EmbeddingGenerationResult {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    dimensions: number;
    model: string;
    status: string;
    processing_time_ms?: number;
    used_fallback?: boolean;
  };
  error?: string;
  retryAfter?: number;
  resetAt?: string;
  remaining?: number;
}

/**
 * Generate embedding for a user profile
 * Triggers the API route to generate embedding using Python worker or Edge Function fallback
 */
export async function generateUserEmbedding(userId: string): Promise<EmbeddingGenerationResult> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return {
      success: false,
      message: "Not authenticated",
      error: "User session not found"
    };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/generate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (response.status === 429) {
      const data = await response.json();
      throw new RateLimitError(
        data.detail?.message || 'Rate limit exceeded',
        data.detail?.retry_after || 3600,
        data.detail?.reset_at || '',
        data.detail?.remaining || 0
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Failed to generate embedding: ${response.statusText}`,
        error: errorData.error || response.statusText
      };
    }

    return response.json();
  } catch {
    if (error instanceof RateLimitError) {
      const minutes = Math.ceil(error.retryAfter / 60);
      return {
        success: false,
        message: `Embedding rate limit exceeded. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        error: 'RateLimitError',
        retryAfter: error.retryAfter,
        resetAt: error.resetAt,
        remaining: error.remaining
      };
    }
    return {
      success: false,
      message: "Failed to generate embedding",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Subscribe to embedding status updates via Supabase Realtime
 * Returns an unsubscribe function
 */
export function subscribeToEmbeddingStatus(
  userId: string,
  callback: (status: EmbeddingStatus) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`embedding-status-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profile_embeddings',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      callback(payload.new as EmbeddingStatus);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get the current embedding status for a user
 */
export async function getEmbeddingStatus(userId: string): Promise<EmbeddingStatus | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("profile_embeddings")
      .select("user_id, status, last_updated, embedding")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no embedding record exists, return null
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching embedding status:", error);
      return null;
    }

    return data;
  } catch {
    console.error("Error fetching embedding status:", error);
    return null;
  }
}

/**
 * Wait for embedding generation to complete
 * Polls the status endpoint until completion or timeout
 */
export async function waitForEmbedding(
  userId: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000,
  onProgress?: (status: EmbeddingStatus, attempt: number) => void
): Promise<EmbeddingStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getEmbeddingStatus(userId);
    
    if (status) {
      if (onProgress) {
        onProgress(status, attempts);
      }

      if (status.status === "completed" || status.status === "failed") {
        return status;
      }
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error("Embedding generation timeout after " + maxAttempts + " attempts");
}

/**
 * Check if a user has a completed embedding
 */
export async function hasCompletedEmbedding(userId: string): Promise<boolean> {
  const status = await getEmbeddingStatus(userId);
  return status?.status === "completed";
}

/**
 * Manually trigger embedding regeneration
 */
export async function regenerateEmbedding(userId: string): Promise<EmbeddingGenerationResult> {
  // First, mark the existing embedding as pending
  const supabase = createClient();
  
  const { error } = await supabase
    .from("profile_embeddings")
    .update({ status: 'pending', last_updated: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      message: "Failed to mark embedding for regeneration",
      error: error.message
    };
  }

  // Then trigger generation
  return generateUserEmbedding(userId);
}

/**
 * Check rate limit status before attempting embedding generation
 * Returns rate limit status without making API call
 */
export async function checkEmbeddingRateLimit(_userId?: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfter?: number;
}> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/rate-limit`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json();
        return {
          allowed: false,
          remaining: data.detail?.remaining || 0,
          resetAt: data.detail?.reset_at || new Date().toISOString(),
          retryAfter: data.detail?.retry_after || 3600,
        };
      }
      
      return {
        allowed: true,
        remaining: 10,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }

    const data = await response.json();
    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetAt: data.reset_at,
      retryAfter: data.retry_after,
    };
  } catch {
    console.error("Error checking embedding rate limit:", error);
    return {
      allowed: true,
      remaining: 10,
      resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * Construct semantic text from profile data
 * Used for testing or manual embedding generation
 */
export function constructSemanticText(
  profile: {
    role?: string;
    headline?: string;
    bio?: string;
    looking_for?: string[];
    location?: string;
  },
  skills: { skill_name: string; proficiency?: string }[],
  interests: { interest: string }[]
): string {
  const skillsText = skills.length > 0 
    ? skills.map(s => s.skill_name).join(', ') 
    : 'None';
  
  const interestsText = interests.length > 0 
    ? interests.map(i => i.interest).join(', ') 
    : 'None';
  
  const goalsText = profile.looking_for && profile.looking_for.length > 0
    ? profile.looking_for.join(', ')
    : 'None';

  return `Role: ${profile.role || 'User'}.
Headline: ${profile.headline || ''}.
Bio: ${profile.bio || ''}.
Skills: ${skillsText}.
Interests: ${interestsText}.
Goals: ${goalsText}.
Location: ${profile.location || ''}.`.trim();
}
