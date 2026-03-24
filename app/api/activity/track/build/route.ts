/**
 * Match Building Activity Tracking API Route
 * Proxies requests to Python worker for match building event tracking
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MatchBuildTrackSchema = z.object({
  matched_user_id: z.string().uuid("Invalid user ID format"),
  action: z.enum(["like", "pass", "super-like"]),
});

export interface MatchBuildTrackResponse {
  success: boolean;
  message?: string;
  data?: {
    activity_id: string;
    user_id: string;
    matched_user_id: string;
    action: "like" | "pass" | "super-like";
    timestamp: string;
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

  // Apply rate limiting (50 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'embeddings');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = MatchBuildTrackSchema.safeParse(body);
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
    
    const { matched_user_id, action } = validationResult.data;
    
    // Prevent self-match tracking
    if (matched_user_id === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot track self match activity" },
        { status: 400 }
      );
    }

    // Verify matched user exists
    const { data: matchedUser } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", matched_user_id)
      .single();

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error with circuit breaker info
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Activity tracking service unavailable",
        message: "Please try again later or contact support",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Call Python worker match building tracking endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/activity/track/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          matched_user_id,
          action,
          request_id: crypto.randomUUID(),
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limit response from worker
      if (workerResponse.status === 429) {
        const rateLimitData = await workerResponse.json();
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded",
            message: rateLimitData.detail?.message || "Maximum tracking requests exceeded",
            retry_after: rateLimitData.detail?.retry_after,
          },
          {
            status: 429,
            headers: {
              'Retry-After': rateLimitData.detail?.retry_after?.toString() || '60',
            }
          }
        );
      }
      
      if (!workerResponse.ok) {
        throw new Error(`Backend error: ${workerResponse.status}`);
      }
      
      const data: MatchBuildTrackResponse = await workerResponse.json();
      
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
      console.error("Python worker match building tracking error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Match building tracking failed",
        message: "Unable to connect to activity tracking service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch {
    console.error("Error in match building tracking:", error);

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
