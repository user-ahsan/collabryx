/**
 * Batch Match Generation API Route
 * Admin-only endpoint for generating matches in bulk
 * Proxies requests to Python worker for batch processing
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";

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
  circuit_breaker_state?: string;
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
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }
  
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Admin check
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  const isAdmin = userProfile?.role === "admin" || process.env.NODE_ENV === "development";
  
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = BatchMatchGenerationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          details: String(validationResult.error) 
        },
        { status: 400 }
      );
    }
    
    const { user_ids, limit, min_score, force_regenerate } = validationResult.data;

    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Match generation service unavailable",
        message: "Python worker backend is not running",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Call Python worker batch match generation endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for batch
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/matches/generate/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_ids,
          limit,
          min_score,
          force_regenerate,
          request_id: crypto.randomUUID(),
          admin_user_id: user.id,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!workerResponse.ok) {
        const errorText = await workerResponse.text();
        throw new Error(`Backend error: ${workerResponse.status} - ${errorText}`);
      }
      
      const data: BatchMatchGenerationResponse = await workerResponse.json();
      
      // Return response with backend mode info
      return NextResponse.json({
        ...data,
        circuit_breaker_state: circuitBreakerState,
      }, {
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
          'X-Backend-Mode': backendConfig.mode,
        }
      });
      
    } catch (workerError) {
      console.error("Python worker batch match generation error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Batch match generation failed",
        message: "Unable to connect to match generation service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch (error) {
    console.error("Error in batch match generation:", error);

    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        circuit_breaker_state: getCircuitBreakerStatus(),
      },
      { status: 500 }
    );
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
