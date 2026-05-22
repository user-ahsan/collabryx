/**
 * Feed Scoring API Route
 * Generates personalized feed scores using the native feed-scorer service.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreFeedForUser, persistFeedScores } from "@/lib/services/feed-scorer";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from '@/lib/utils/api-response';

export const runtime = "edge";
export const dynamic = "force-dynamic";

const FeedScoreRequestSchema = z.object({
  posts: z.array(z.object({
    post_id: z.string().uuid(),
    semantic: z.number().min(0).max(1),
    engagement_successes: z.number().int().min(0).default(0),
    engagement_failures: z.number().int().min(0).default(0),
    hours_old: z.number().min(0),
    is_connected: z.boolean().default(false),
    has_shared_interests: z.boolean().default(false),
    intent_match: z.boolean().default(false),
  })).min(1).max(100),
  persist: z.boolean().default(false),
});

export interface FeedScoreResponse {
  success: boolean;
  data?: {
    scored_posts: Array<{
      post_id: string;
      score: number;
      factors: Record<string, unknown>;
    }>;
    persisted: boolean;
    saved_count?: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value || null;

  if (requiresCSRF(request.method)) {
    const isValid = await validateCSRFRequest(csrfToken, cookieToken);
    if (!isValid) {
      return errorResponse('INVALID_CSRF', 'Invalid CSRF token', 403);
    }
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const rateLimitResult = rateLimit(request, 'api');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));

    const validationResult = FeedScoreRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400);
    }

    const { posts, persist } = validationResult.data;

    const scoredPosts = scoreFeedForUser(
      posts.map(p => ({
        postId: p.post_id,
        params: {
          semantic: p.semantic,
          engagementSuccesses: p.engagement_successes,
          engagementFailures: p.engagement_failures,
          hoursOld: p.hours_old,
          isConnected: p.is_connected,
          hasSharedInterests: p.has_shared_interests,
          intentMatch: p.intent_match,
        },
      })),
      user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    );

    let savedCount: number | undefined;
    if (persist) {
      const adminClient = supabase;
      const result = await persistFeedScores(adminClient, user.id, scoredPosts);
      savedCount = result.saved;
    }

    return NextResponse.json({
      success: true,
      data: {
        scored_posts: scoredPosts.map(sp => ({
          post_id: sp.postId,
          score: sp.score,
          factors: sp.factors,
        })),
        persisted: persist,
        saved_count: savedCount,
      },
    });

  } catch (error) {
    console.error("Error in feed scoring:", error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-CSRF-Token",
    },
  });
}
