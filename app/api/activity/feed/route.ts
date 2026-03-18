/**
 * Activity Feed Retrieval API Route
 * Proxies requests to Python worker for user activity feed retrieval
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ActivityFeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  activity_type: z.enum(["all", "profile_view", "building_match", "skill_match"]).optional().default("all"),
});

export interface ActivityFeedItem {
  id: string;
  actor_user_id: string;
  target_user_id: string;
  type: "profile_view" | "building_match" | "skill_match";
  activity: string;
  match_percentage?: number;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
  target_name?: string;
  target_avatar?: string;
}

export interface ActivityFeedResponse {
  success: boolean;
  message?: string;
  data?: {
    items: ActivityFeedItem[];
    total_count: number;
    has_more: boolean;
    limit: number;
    offset: number;
    backend_mode: string;
  };
  error?: string;
  circuit_breaker_state?: string;
}

export async function GET(request: NextRequest) {
  // Validate CSRF token for security (optional for GET requests)
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

  // Apply rate limiting (60 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'embeddings');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  try {
    const validationResult = ActivityFeedQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid query parameters",
          details: String(validationResult.error) 
        },
        { status: 400 }
      );
    }
    
    const { limit, offset, activity_type } = validationResult.data;

    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error with circuit breaker info
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Activity feed service unavailable",
        message: "Please try again later or contact support",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Call Python worker activity feed endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      const url = new URL(`${backendConfig.endpoint}/api/activity/feed`);
      url.searchParams.set('user_id', user.id);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());
      if (activity_type !== 'all') {
        url.searchParams.set('activity_type', activity_type);
      }
      
      const workerResponse = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
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
            message: rateLimitData.detail?.message || "Maximum feed requests exceeded",
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
      
      const data: ActivityFeedResponse = await workerResponse.json();
      
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
      console.error("Python worker activity feed error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Activity feed retrieval failed",
        message: "Unable to connect to activity feed service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch (error) {
    console.error("Error in activity feed retrieval:", error);

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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-CSRF-Token",
    },
  });
}
