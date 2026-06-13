/**
 * Match Generation API Route
 * Generates match suggestions using the native match-generator service
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchClient } from "@/lib/worker-client";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from '@/lib/utils/api-response';

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MatchGenerationRequestSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format").optional(),
  limit: z.number().min(1).max(100).default(20),
  min_score: z.number().min(0).max(100).default(50),
});

export interface MatchGenerationResponse {
  success: boolean;
  message?: string;
  data?: {
    user_id: string;
    matches_generated: number;
    status: "queued" | "processing" | "completed" | "failed";
    backend_mode: string;
    suggestions?: Array<{
      matched_user_id: string;
      match_percentage: number;
      reasons: string[];
      ai_confidence?: number;
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  // Validate CSRF token for security
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value || null;
  
  if (requiresCSRF(request.method)) {
    const isValid = await validateCSRFRequest(csrfToken, cookieToken);
    if (!isValid) {
      console.warn('⚠️ CSRF validation failed:', {
        hasHeaderToken: !!csrfToken,
        hasCookieToken: !!cookieToken,
        path: request.url,
      });
      return errorResponse('INVALID_CSRF', 'Invalid CSRF token', 403)
    }
  }
  
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return errorResponse('UNAUTHORIZED', 'Unauthorized', 401)
  }

  // Apply rate limiting (10 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'matches');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  let userId = user.id;

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = MatchGenerationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400)
    }
    
    const { user_id, limit, min_score } = validationResult.data;
    
    // Only allow users to generate matches for themselves
    userId = user_id || user.id;
    if (userId !== user.id) {
      return errorResponse('FORBIDDEN', 'Cannot generate matches for other users', 403)
    }

    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, profile_completion")
      .eq("id", userId)
      .single();

    if (!profile?.onboarding_completed) {
      return errorResponse('ONBOARDING_INCOMPLETE', 'Please complete your profile before generating matches', 400)
    }

    // Check if user has vector embedding
    const { data: embedding } = await supabase
      .from("profile_embeddings")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (!embedding || embedding.status !== "completed") {
      return errorResponse('EMBEDDING_NOT_READY', 'Please wait for your profile embedding to be generated', 400)
    }

    // Generate matches using native service
    const matches = await matchClient.generate({ user_id: userId, limit, min_score });

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        matches_generated: matches.length,
        status: 'completed' as const,
        backend_mode: 'native',
        suggestions: matches.map(m => ({
          matched_user_id: m.matched_user_id,
          match_percentage: m.match_percentage,
          reasons: m.reasons,
          ai_confidence: m.ai_confidence,
        })),
      },
    });

  } catch (error) {
    console.error("Error in match generation:", error);

    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

// Handle CORS preflight
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
