/**
 * Embedding Service
 * Handles vector embedding generation and status tracking for user profiles
 */

import { createClient } from "@/lib/supabase/client";

export interface EmbeddingStatus {
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_updated: string;
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
  };
  error?: string;
}

/**
 * Generate embedding for a user profile
 * Triggers the Edge Function to generate embedding using Python worker
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Failed to generate embedding: ${response.statusText}`,
        error: errorData.error || response.statusText
      };
    }

    return response.json();
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate embedding",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get the current embedding status for a user
 */
export async function getEmbeddingStatus(userId: string): Promise<EmbeddingStatus | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("profile_embeddings")
      .select("user_id, status, last_updated")
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
  } catch (error) {
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
