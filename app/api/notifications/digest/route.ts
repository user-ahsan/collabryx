/**
 * Notification Digest API Route
 * Proxies requests to Python worker for daily digest sending
 * Admin-only access
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig, getCircuitBreakerStatus } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const NotificationDigestRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  batch_size: z.number().min(1).max(1000).default(100),
  dry_run: z.boolean().default(false),
});

export interface NotificationDigestResponse {
  success: boolean;
  message?: string;
  data?: {
    digests_queued: number;
    digests_sent: number;
    digests_failed: number;
    status: "queued" | "processing" | "completed" | "failed";
    backend_mode: string;
    schedule_metadata?: {
      triggered_at: string;
      triggered_by: string;
      date_range?: {
        start: string;
        end: string;
      };
    };
  };
  error?: string;
  circuit_breaker_state?: string;
}

/**
 * Check if user has admin privileges
 * For now, we check if user has service_role claim or is in admin list
 */
async function checkAdminAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isAdmin: false, error: "Unauthorized" };
  }

  // Check for admin role in user metadata or app_metadata
  const userMetadata = user.user_metadata as { role?: string; user_role?: string } | null;
  const userRole = userMetadata?.role || userMetadata?.user_role;
  
  // Allow service_role or admin role
  if (userRole === 'service_role' || userRole === 'admin') {
    return { isAdmin: true, userId: user.id };
  }

  // Check against allowed admin emails from environment
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  const userEmail = user.email?.toLowerCase();
  
  if (userEmail && adminEmails.includes(userEmail)) {
    return { isAdmin: true, userId: user.id };
  }

  return { isAdmin: false, error: "Admin access required" };
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
  
  // Check admin access
  const adminCheck = await checkAdminAccess(supabase);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, error: adminCheck.error || "Admin access required" },
      { status: 403 }
    );
  }

  // Apply stricter rate limiting for admin endpoints (5 requests per 15min)
  const rateLimitResult = rateLimit(request, 'auth');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = NotificationDigestRequestSchema.safeParse(body);
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
    
    const { date, batch_size, dry_run } = validationResult.data;
    
    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error with circuit breaker info
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Digest service unavailable",
        message: "Please try again later or contact support",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Prepare schedule metadata
    const scheduleMetadata = {
      triggered_at: new Date().toISOString(),
      triggered_by: adminCheck.userId,
      date_range: date ? {
        start: date,
        end: date,
      } : undefined,
    };

    // Call Python worker digest endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for batch operations
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/notifications/digest/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          batch_size,
          dry_run,
          schedule_metadata: scheduleMetadata,
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
              message: rateLimitData.detail?.message || "Maximum digest requests exceeded",
              retry_after: rateLimitData.detail?.retry_after,
            },
            {
              status: 429,
              headers: {
                'Retry-After': rateLimitData.detail?.retry_after?.toString() || '3600',
              }
            }
          );
        }
        throw new Error(`Backend error: ${workerResponse.status}`);
      }
      
      const data: NotificationDigestResponse = await workerResponse.json();
      
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
      console.error("Python worker digest send error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Digest delivery failed",
        message: "Unable to connect to digest service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch (error) {
    console.error("Error in notification digest:", error);

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
