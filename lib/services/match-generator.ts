/**
 * Match Generator Service
 * Generates match suggestions using cosine similarity and weighted scoring.
 * Uses Supabase service_role client to bypass RLS for batch operations.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createSupabaseClient<any>>;

// ===========================================
// COSINE SIMILARITY
// ===========================================

/** Match proxy.ts isDevMode — accepts "true", "testing", "development" */
function isDevMode(): boolean {
  const value = process.env.DEVELOPMENT_MODE
  if (!value) return false
  const n = value.toLowerCase().trim()
  return n === "true" || n === "testing" || n === "development"
}

/** Supabase JS client returns pgvector columns as strings like "[-0.03,0.01,...]".
 *  Parse to a number array. Already an array -> pass through. */
function parseVector(v: unknown): number[] {
  if (Array.isArray(v)) return v as number[]
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as number[]
    } catch {
      return []
    }
  }
  return []
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < minLen; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ===========================================
// MATCH SCORE CALCULATION
// ===========================================

export interface MatchScoreBreakdown {
  semanticSimilarity: number;
  skillsOverlap: number;
  complementaryScore: number;
  sharedInterests: number;
  activityMatch: number;
  overallScore: number;
}

const WEIGHTS = {
  semantic: 0.4,
  skills: 0.2,
  complementary: 0.15,
  interests: 0.15,
  activity: 0.1,
} as const;

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function calculateMatchScore(
  userEmbedding: number[],
  matchedEmbedding: number[],
  userSkills: string[],
  matchedSkills: string[],
  userInterests: string[],
  matchedInterests: string[],
  userActivity: string,
  matchedActivity: string,
): MatchScoreBreakdown {
  const semantic = Math.max(0, cosineSimilarity(userEmbedding, matchedEmbedding));
  const skillsOverlap = Math.round(jaccardSimilarity(userSkills, matchedSkills) * 100);
  const complementaryScore = Math.round((1 - jaccardSimilarity(userSkills, matchedSkills)) * 100);
  const sharedInterests = Math.round(jaccardSimilarity(userInterests, matchedInterests) * 100);
  const activityMatch = userActivity === matchedActivity ? 1 : 0;

  const overallScore = Math.round(
    semantic * 100 * WEIGHTS.semantic +
      skillsOverlap * WEIGHTS.skills +
      complementaryScore * WEIGHTS.complementary +
      sharedInterests * WEIGHTS.interests +
      activityMatch * 100 * WEIGHTS.activity,
  );

  return {
    semanticSimilarity: Math.round(semantic * 100) / 100,
    skillsOverlap,
    complementaryScore,
    sharedInterests,
    activityMatch,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };
}

// ===========================================
// MATCH GENERATION
// ===========================================

export interface GenerateMatchesOptions {
  limit?: number;
  minScore?: number;
  excludeUserIds?: string[];
}

export interface GeneratedMatchSuggestion {
  matchedUserId: string;
  matchPercentage: number;
  reasons: string[];
  aiConfidence?: number;
  scoreBreakdown: MatchScoreBreakdown;
}

function getAdminClient(): SupabaseAdmin {
  // TODO: Restrict admin client usage to admin-only endpoints. The service_role client
  // bypasses RLS, so it must not be used for user-facing queries. (#146)
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );
}

function generateReasons(breakdown: MatchScoreBreakdown, overlappingSkills: string[]): string[] {
  const reasons: string[] = [];
  if (breakdown.semanticSimilarity > 0.7) reasons.push("High semantic profile similarity");
  if (breakdown.skillsOverlap > 30)
    reasons.push(`${breakdown.skillsOverlap}% skill overlap: ${overlappingSkills.slice(0, 3).join(", ")}`);
  if (breakdown.sharedInterests > 25) reasons.push("Shared interests detected");
  if (breakdown.activityMatch === 1) reasons.push("Matching collaboration availability");
  if (breakdown.complementaryScore > 60) reasons.push("Complementary skill sets");
  if (reasons.length === 0) reasons.push("General profile compatibility");
  return reasons;
}

async function persistMatchScores(
  supabase: SupabaseAdmin,
  userId: string,
  suggestions: GeneratedMatchSuggestion[],
  allCandidateSkills: Map<string, string[]>,
) {
  if (suggestions.length === 0) return;

  const matchedUserIds = suggestions.map((s) => s.matchedUserId);

  // Batched query using .in() filter to retrieve all relevant match suggestions in a single roundtrip, eliminating N+1 DB operations
  const { data: existingSuggestions, error: fetchError } = await supabase
    .from("match_suggestions")
    .select("id, matched_user_id")
    .eq("user_id", userId)
    .in("matched_user_id", matchedUserIds);

  if (fetchError || !existingSuggestions || existingSuggestions.length === 0) {
    if (fetchError) {
      logger.app.error("Error batch fetching existing match suggestions", {
        message: fetchError.message,
        code: (fetchError as unknown as Record<string, unknown>).code,
      });
    }
    return;
  }

  // Create a fast lookup map of matched_user_id -> suggestion_id
  const suggestionIdMap = new Map<string, string>();
  for (const sug of existingSuggestions) {
    suggestionIdMap.set(sug.matched_user_id, sug.id);
  }

  const scoresToUpsert = [];

  for (const s of suggestions) {
    const suggestionId = suggestionIdMap.get(s.matchedUserId);
    if (!suggestionId) continue;

    const candSkills = allCandidateSkills.get(s.matchedUserId) ?? [];
    const overlappingSkills = candSkills.filter((cs) =>
      s.reasons.some((r) => r.toLowerCase().includes(cs.toLowerCase())),
    );

    scoresToUpsert.push({
      suggestion_id: suggestionId,
      semantic_similarity: s.scoreBreakdown.semanticSimilarity,
      skills_overlap: s.scoreBreakdown.skillsOverlap,
      complementary_score: s.scoreBreakdown.complementaryScore,
      shared_interests: s.scoreBreakdown.sharedInterests,
      activity_match: s.scoreBreakdown.activityMatch,
      overall_score: s.scoreBreakdown.overallScore,
      overlapping_skills: overlappingSkills,
    });
  }

  if (scoresToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("match_scores")
      .upsert(scoresToUpsert, { onConflict: "suggestion_id" });

    if (upsertError) {
      logger.app.error("Failed to batch upsert match_scores", {
        message: upsertError.message,
        code: (upsertError as unknown as Record<string, unknown>).code,
        details: (upsertError as unknown as Record<string, unknown>).details,
      });
    }
  }
}

export async function generateMatchesForUser(
  userId: string,
  options?: GenerateMatchesOptions,
): Promise<GeneratedMatchSuggestion[]> {
  const { limit = 20, minScore = 50, excludeUserIds = [] } = options ?? {};
  // Admin client bypasses RLS safely as this runs solely in a secure system/API endpoint context
  const supabase = getAdminClient();

  const { data: userEmbedding, error: embError } = await supabase
    .from("profile_embeddings")
    .select("user_id, embedding, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .single();

  if (embError || !userEmbedding?.embedding) return [];

  const parsedUserEmbedding = parseVector(userEmbedding.embedding);
  if (isDevMode()) {
    console.log("[match-generator] embedding dims:", parsedUserEmbedding.length);
  }

  const [{ data: userSkillsData }, { data: userInterestsData }, { data: userProfile }, { data: prefs }] =
    await Promise.all([
      supabase.from("user_skills").select("skill_name").eq("user_id", userId),
      supabase.from("user_interests").select("interest").eq("user_id", userId),
      supabase.from("profiles").select("id, collaboration_readiness").eq("id", userId).single(),
      supabase.from("match_preferences").select("min_match_percentage").eq("user_id", userId).single(),
    ]);

  const userSkills = userSkillsData?.map((s) => s.skill_name) ?? [];
  const userInterests = userInterestsData?.map((i) => i.interest) ?? [];
  const userActivity = userProfile?.collaboration_readiness ?? "";
  const effectiveMinScore = Math.max(minScore, prefs?.min_match_percentage ?? minScore);

  const excludeList = [userId, ...excludeUserIds];

  // Fetch blocked users (both directions) to exclude
  // Use separate parameterized queries to avoid SQL injection in .or() (#137)
  const [{ data: blockedByUser }, { data: blockingUser }] = await Promise.all([
    supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", userId),
    supabase
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocked_id", userId),
  ]);
  const blockedIds = [
    ...(blockedByUser?.map((b) => b.blocked_id) ?? []),
    ...(blockingUser?.map((b) => b.blocker_id) ?? []),
  ];
  excludeList.push(...blockedIds);

  let query = supabase
    .from("profile_embeddings")
    .select("user_id, embedding, status")
    .eq("status", "completed");

  if (excludeList.length > 0) {
    // Supabase .not().in() requires parenthesized CSV string: "(id1,id2)"
    query = query.not("user_id", "in", `(${excludeList.join(",")})`);
  }

  const { data: candidates, error: candError } = await query;

  if (candError || !candidates) {
    if (isDevMode()) {
      console.warn("[match-generator] candidate fetch error:", candError);
    }
    return [];
  }

  const suggestions: GeneratedMatchSuggestion[] = [];
  const candidateSkillsMap = new Map<string, string[]>();

  const candidateIds = candidates
    .filter((c) => c.embedding)
    .map((c) => c.user_id);

  const [{ data: allCandidateSkills }, { data: allCandidateInterests }, { data: allCandidateProfiles }] = await Promise.all([
    supabase.from("user_skills").select("user_id, skill_name").in("user_id", candidateIds),
    supabase.from("user_interests").select("user_id, interest").in("user_id", candidateIds),
    supabase.from("profiles").select("id, collaboration_readiness").in("id", candidateIds),
  ]);

  const batchSkillsMap = new Map<string, string[]>();
  const batchInterestsMap = new Map<string, string[]>();
  const batchActivityMap = new Map<string, string>();

  for (const row of allCandidateSkills ?? []) {
    const list = batchSkillsMap.get(row.user_id) ?? [];
    list.push(row.skill_name);
    batchSkillsMap.set(row.user_id, list);
  }

  for (const row of allCandidateInterests ?? []) {
    const list = batchInterestsMap.get(row.user_id) ?? [];
    list.push(row.interest);
    batchInterestsMap.set(row.user_id, list);
  }

  for (const row of allCandidateProfiles ?? []) {
    batchActivityMap.set(row.id, row.collaboration_readiness ?? "");
  }

  let scoredCount = 0;
  for (const candidate of candidates) {
    if (!candidate.embedding) continue;

    const candData = {
      skills: batchSkillsMap.get(candidate.user_id) ?? [],
      interests: batchInterestsMap.get(candidate.user_id) ?? [],
      activity: batchActivityMap.get(candidate.user_id) ?? "",
    };
    candidateSkillsMap.set(candidate.user_id, candData.skills);

    const candEmbedding = parseVector(candidate.embedding);
    const breakdown = calculateMatchScore(
      parsedUserEmbedding,
      candEmbedding,
      userSkills,
      candData.skills,
      userInterests,
      candData.interests,
      userActivity,
      candData.activity,
    );

    if (breakdown.overallScore < effectiveMinScore) continue;
    scoredCount++;

    const overlappingSkills = userSkills.filter((s) =>
      candData.skills.some((cs) => cs.toLowerCase() === s.toLowerCase()),
    );

    suggestions.push({
      matchedUserId: candidate.user_id,
      matchPercentage: breakdown.overallScore,
      reasons: generateReasons(breakdown, overlappingSkills),
      scoreBreakdown: breakdown,
    });
  }

  suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
  const topSuggestions = suggestions.slice(0, limit);

  if (isDevMode()) {
    console.log(
      `[match-generator] ${candidates.length} candidates → ${scoredCount} above minScore → returning ${topSuggestions.length}`
    );
  }

  if (topSuggestions.length > 0) {
    const { error: insertError } = await supabase.from("match_suggestions").upsert(
      topSuggestions.map((s) => ({
        user_id: userId,
        matched_user_id: s.matchedUserId,
        match_percentage: s.matchPercentage,
        reasons: s.reasons,
        status: "active" as const,
      })),
      { onConflict: "user_id,matched_user_id" },
    );

    if (insertError) {
      const err = insertError as unknown as Record<string, unknown>;
      logger.app.error("Error inserting match suggestions", {
        errorMessage: insertError.message,
        errorCode: err.code,
        errorDetails: err.details,
        errorHint: err.hint,
        userId,
        suggestionCount: topSuggestions.length,
      });
    }

    await persistMatchScores(supabase, userId, topSuggestions, candidateSkillsMap);
  }

  return topSuggestions;
}

// ===========================================
// BATCH MATCH GENERATION
// ===========================================

export interface BatchMatchResult {
  userId: string;
  status: "success" | "failed" | "skipped";
  matchesGenerated?: number;
  error?: string;
}

export async function generateBatchMatches(
  userIds: string[],
  options?: GenerateMatchesOptions,
): Promise<BatchMatchResult[]> {
  const results: BatchMatchResult[] = [];

  for (const userId of userIds) {
    try {
      const suggestions = await generateMatchesForUser(userId, options);
      results.push({ userId, status: "success", matchesGenerated: suggestions.length });
    } catch (error) {
      results.push({
        userId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
