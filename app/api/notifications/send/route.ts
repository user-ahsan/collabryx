/**
 * Notification Send API Route
 * Proxies requests to Python worker for single notification delivery
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const NotificationSendRequestSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  type: z.enum(["connect", "message", "like", "comment", "system", "match"]),
  content: z.string().min(1).max(500),
  actor_id: z.string().uuid().optional(),
  actor_name: z.string().max(100).optional(),
  actor_avatar: z.string().url().optional(),
  resource_type: z.enum(["post", "profile", "conversation", "match"]).optional(),
  resource_id: z.string().uuid().optional(),
});

export interface NotificationSendResponse {
  success: boolean;
  message?: string;
  data?: {
    notification_id: string;
    user_id: string;
    type: string;
    status: "queued" | "sent" | "failed";
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

  // Apply rate limiting (20 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'embeddings');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = NotificationSendRequestSchema.safeParse(body);
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
    
    const { user_id, type, content, actor_id, actor_name, actor_avatar, resource_type, resource_id } = validationResult.data;
    
    // Verify recipient exists
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", user_id)
      .single();

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Verify actor exists if provided
    if (actor_id) {
      const { data: actor } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", actor_id)
        .single();

      if (!actor) {
        return NextResponse.json(
          { success: false, error: "Actor not found" },
          { status: 404 }
        );
      }
    }

    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error with circuit breaker info
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Notification service unavailable",
        message: "Please try again later or contact support",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Call Python worker notification send endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          type,
          content,
          actor_id,
          actor_name,
          actor_avatar,
          resource_type,
          resource_id,
          request_id: crypto.randomUUID(),
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!workerResponse.ok) {
        if (workerResponse.status === 429) {
          const rateLimitData = await workerResponse.json();
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded",
              message: rateLimitData.detail?.message || "Maximum notification requests exceeded",
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
        throw new Error(`Backend error: ${workerResponse.status}`);
      }
      
      const data: NotificationSendResponse = await workerResponse.json();
      
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
      console.error("Python worker notification send error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Notification delivery failed",
        message: "Unable to connect to notification service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch {
    console.error("Error in notification send:", error);

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
