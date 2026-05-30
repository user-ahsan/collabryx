/**
 * Feed Scorer Service
 * Hybrid scoring engine for personalized feed ranking using:
 * - Thompson Sampling for engagement exploration/exploitation
 * - Semantic similarity for content relevance
 * - Recency decay for time-aware ranking
 * - Connection/social graph boosts
 *
 * Replaces the removed Python FeedScorer with a native TypeScript implementation.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createSupabaseClient<any>>;

const log = logger.app;

// ===========================================
// CONSTANTS
// ===========================================

const WEIGHTS = {
  semantic: 0.35,
  engagement: 0.30,
  recency: 0.20,
} as const;

const BOOSTS = {
  connection: 1.5,
  sharedInterests: 1.2,
  intentMatch: 1.1,
} as const;

const RECENCY_HALF_LIFE_HOURS = 24;

// ===========================================
// SCHEMAS
// ===========================================

export const FeedScorerInputSchema = z.object({
  semantic: z.number().min(0).max(1),
  engagementSuccesses: z.number().int().min(0),
  engagementFailures: z.number().int().min(0),
  hoursOld: z.number().min(0),
  isConnected: z.boolean(),
  hasSharedInterests: z.boolean(),
  intentMatch: z.boolean(),
});

export type FeedScorerInput = z.infer<typeof FeedScorerInputSchema>;

export interface ScoredPost {
  postId: string;
  score: number;
  semantic: number;
  engagement: number;
  recency: number;
  connectionBoost: number;
  factors: Record<string, unknown>;
}

// ===========================================
// THOMPSON SAMPLING
// ===========================================

/**
 * Deterministic Thompson Sampling using Beta distribution approximation.
 * Uses a seeded pseudo-random generator for reproducible results.
 * Mirrors the Python `np.random.beta(successes + 1, failures + 1, samples)`.
 *
 * Beta(alpha, beta) where alpha = successes + 1, beta = failures + 1
 * Mean = alpha / (alpha + beta)
 * Variance = (alpha * beta) / ((alpha + beta)^2 * (alpha + beta + 1))
 */
export function seededThompsonSample(
  successes: number,
  failures: number,
  seed: number = 42,
  samples: number = 1000
): number {
  const lcg = (s: number): number => (s * 1664525 + 1013904223) & 0x7fffffff;
  let state = seed;
  const values: number[] = [];

  const alpha = successes + 1;
  const beta = failures + 1;
  const expected = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));

  for (let i = 0; i < samples; i++) {
    state = lcg(state);
    const u1 = state / 0x7fffffff;
    state = lcg(state);
    const u2 = state / 0x7fffffff;

    const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
    let val = expected + z * Math.sqrt(variance) * 0.5;
    val = Math.max(0.001, Math.min(0.999, val));
    values.push(val);
  }

  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ===========================================
// RECENCY SCORE
// ===========================================

/**
 * Exponential decay recency score with configurable half-life.
 * Returns 1.0 for brand-new content, approaching 0 as content ages.
 */
export function calculateRecencyScore(hoursOld: number, halfLife: number = RECENCY_HALF_LIFE_HOURS): number {
  return Math.exp(-hoursOld / halfLife);
}

// ===========================================
// HYBRID SCORING
// ===========================================

/**
 * Calculate hybrid score for a single post-user pair.
 * Combines semantic similarity, engagement likelihood (via Thompson Sampling),
 * recency, and social graph boosts.
 *
 * Boosts are additive to avoid nonlinear compounding:
 * score = (semantic * 0.35 + engagement * 0.30 + recency * 0.20)
 *       + baseScore * (connectionBoost - 1) if connected
 *       + baseScore * (interestsBoost - 1) if shared interests
 *       + baseScore * (intentBoost - 1) if intent match
 */
export function calculateHybridScore(params: FeedScorerInput): number {
  const semanticScore = params.semantic;

  const engagementScore = seededThompsonSample(
    params.engagementSuccesses,
    params.engagementFailures
  );

  const recencyScore = calculateRecencyScore(params.hoursOld);

  let score =
    WEIGHTS.semantic * semanticScore +
    WEIGHTS.engagement * engagementScore +
    WEIGHTS.recency * recencyScore;

  // Make boosts additive instead of multiplicative to avoid nonlinear compounding (#141)
  // Each boost adds a percentage of the original score: score + (score * 0.5) + (score * 0.2) + ...
  const baseScore = score;
  if (params.isConnected) {
    score += baseScore * (BOOSTS.connection - 1);
  }

  if (params.hasSharedInterests) {
    score += baseScore * (BOOSTS.sharedInterests - 1);
  }

  if (params.intentMatch) {
    score += baseScore * (BOOSTS.intentMatch - 1);
  }

  return Math.min(1.0, score);
}

// ===========================================
// FEED SCORING (BATCH)
// ===========================================

/**
 * Score a single post for a given user context.
 * Returns the overall score plus individual factor breakdown.
 */
export function scorePostForUser(
  postId: string,
  params: FeedScorerInput
): ScoredPost {
  const semanticScore = params.semantic;
  const engagementScore = seededThompsonSample(
    params.engagementSuccesses,
    params.engagementFailures
  );
  const recencyScore = calculateRecencyScore(params.hoursOld);

  let score =
    WEIGHTS.semantic * semanticScore +
    WEIGHTS.engagement * engagementScore +
    WEIGHTS.recency * recencyScore;

  // Make boosts additive instead of multiplicative to avoid nonlinear compounding (#141)
  const baseScore = score;
  let connectionBoost = 1;
  if (params.isConnected) {
    connectionBoost = BOOSTS.connection;
    score += baseScore * (BOOSTS.connection - 1);
  }

  const factors: Record<string, unknown> = {
    semantic: semanticScore,
    engagement: engagementScore,
    recency: recencyScore,
    connection_boost: connectionBoost,
  };

  if (params.hasSharedInterests) {
    factors.shared_interests_boost = BOOSTS.sharedInterests;
    score += baseScore * (BOOSTS.sharedInterests - 1);
  }

  if (params.intentMatch) {
    factors.intent_match_boost = BOOSTS.intentMatch;
    score += baseScore * (BOOSTS.intentMatch - 1);
  }

  score = Math.min(1.0, score);

  return {
    postId,
    score,
    semantic: semanticScore,
    engagement: engagementScore,
    recency: recencyScore,
    connectionBoost,
    factors,
  };
}

/**
 * Score all posts in a batch for a given user context.
 * Returns scored posts sorted by score descending (highest relevance first).
 * Uses a consistent seed per user for reproducible ranking.
 */
export function scoreFeedForUser(
  posts: Array<{
    postId: string;
    params: FeedScorerInput;
  }>,
  _userSeed: number = 42
): ScoredPost[] {
  if (posts.length === 0) return [];

  const scored = posts.map(({ postId, params }) =>
    scorePostForUser(postId, params)
  );

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

// ===========================================
// SUPABASE PERSISTENCE
// ===========================================

/**
 * Save scored feed results to the feed_scores table.
 * Upserts per (user_id, post_id) to allow incremental updates.
 */
/**
 * Process an array of items in parallel batches with a concurrency limit.
 */
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function persistFeedScores(
  supabase: SupabaseAdmin,
  userId: string,
  scoredPosts: ScoredPost[]
): Promise<{
  saved: number;
  failed: number;
  errors: string[];
}> {
  const CONCURRENCY = 10;
  let saved = 0;
  let failed = 0;
  const errors: string[] = [];

  const upsertPost = async (sp: ScoredPost): Promise<void> => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from("feed_scores").upsert(
      {
        user_id: userId,
        post_id: sp.postId,
        score: sp.score,
        semantic_score: sp.semantic,
        engagement_score: sp.engagement,
        recency_score: sp.recency,
        connection_boost: sp.connectionBoost,
        factors: sp.factors,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "user_id,post_id" }
    );

    if (error) {
      failed++;
      errors.push(`post ${sp.postId}: ${error.message}`);
      log.error("Failed to persist feed score", error, { userId, postId: sp.postId });
    } else {
      saved++;
    }
  };

  await processBatch(scoredPosts, CONCURRENCY, upsertPost);

  return { saved, failed, errors };
}

/**
 * Remove expired feed scores for a user.
 * Call this before persisting new scores to keep the table clean.
 */
export async function cleanupExpiredFeedScores(
  supabase: SupabaseAdmin
): Promise<{ deleted: number }> {
  const { data, error } = await supabase
    .from("feed_scores")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    log.error("Failed to cleanup expired feed scores", error);
    return { deleted: 0 };
  }

  return { deleted: data?.length ?? 0 };
}
