/**
 * Profile View Tracking API Route
 * Proxies requests to Python worker for profile view tracking
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ProfileViewTrackSchema = z.object({
  viewed_user_id: z.string().uuid("Invalid user ID format"),
});

export interface ProfileViewTrackResponse {
  success: boolean;
  message?: string;
  data?: {
    activity_id: string;
    viewer_id: string;
    viewed_user_id: string;
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

  // Apply rate limiting (30 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'embeddings');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = ProfileViewTrackSchema.safeParse(body);
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
    
    const { viewed_user_id } = validationResult.data;
    
    // Prevent self-view tracking
    if (viewed_user_id === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot track self profile views" },
        { status: 400 }
      );
    }

    // Verify viewed user exists
    const { data: viewedUser } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", viewed_user_id)
      .single();

    if (!viewedUser) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
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

    // Call Python worker profile view tracking endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/activity/track/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          viewer_id: user.id,
          viewed_user_id,
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
      
      const data: ProfileViewTrackResponse = await workerResponse.json();
      
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
      console.error("Python worker profile view tracking error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Profile view tracking failed",
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
    console.error("Error in profile view tracking:", error);

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
