/**
 * Batch Match Generation API Route
 * Admin-only endpoint for generating matches in bulk
 * Uses native match-generator service
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchClient } from "@/lib/worker-client";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { errorResponse } from '@/lib/utils/api-response';

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BatchMatchGenerationRequestSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(100),
  limit: z.number().min(1).max(100).default(20),
  min_score: z.number().min(0).max(100).default(50),
  force_regenerate: z.boolean().default(false),
});

export interface BatchMatchGenerationResponse {
  success: boolean;
  message?: string;
  data?: {
    batch_id: string;
    total_users: number;
    processed: number;
    succeeded: number;
    failed: number;
    status: "queued" | "processing" | "completed" | "partial" | "failed";
    results?: Array<{
      user_id: string;
      status: "success" | "failed" | "skipped";
      matches_generated?: number;
      error?: string;
    }>;
    backend_mode: string;
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

  // Admin check
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  const isAdmin = userProfile?.role === "admin" || process.env.DEVELOPMENT_MODE === "true";
  
  if (!isAdmin) {
    return errorResponse('FORBIDDEN', 'Admin access required', 403)
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = BatchMatchGenerationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400)
    }
    
    const { user_ids, limit, min_score: _min_score } = validationResult.data;

    const results = await matchClient.generateBatch({ userIds: user_ids, limitPerUser: limit });

    return NextResponse.json({
      success: true,
      data: {
        batch_id: crypto.randomUUID(),
        total_users: user_ids.length,
        processed: results.length,
        succeeded: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "failed").length,
        status: "completed" as const,
        results: results.map((r) => ({
          user_id: r.userId,
          status: r.status,
          matches_generated: r.matchesGenerated,
          error: r.error,
        })),
        backend_mode: "native",
      },
    });

  } catch (error) {
    console.error("Error in batch match generation:", error);

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
