/**
 * Notification Cleanup API Route
 * Proxies requests to Python worker for old notification cleanup
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

const NotificationCleanupRequestSchema = z.object({
  older_than_days: z.number().min(1).max(365).default(30),
  batch_size: z.number().min(1).max(1000).default(500),
  dry_run: z.boolean().default(false),
  user_id: z.string().uuid().optional(),
});

export interface NotificationCleanupResponse {
  success: boolean;
  message?: string;
  data?: {
    notifications_deleted: number;
    notifications_archived: number;
    status: "queued" | "processing" | "completed" | "failed";
    backend_mode: string;
    cleanup_metadata?: {
      triggered_at: string;
      triggered_by: string;
      older_than_days: number;
      cutoff_date: string;
      target_user_id?: string;
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
    
    const validationResult = NotificationCleanupRequestSchema.safeParse(body);
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
    
    const { older_than_days, batch_size, dry_run, user_id } = validationResult.data;
    
    // Get backend configuration with circuit breaker
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // If backend is unavailable, return error with circuit breaker info
    if (!backendConfig.endpoint) {
      return NextResponse.json({
        success: false,
        error: "Cleanup service unavailable",
        message: "Please try again later or contact support",
        circuit_breaker_state: circuitBreakerState,
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': circuitBreakerState,
        }
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - older_than_days);

    // Prepare cleanup metadata
    const cleanupMetadata = {
      triggered_at: new Date().toISOString(),
      triggered_by: adminCheck.userId,
      older_than_days,
      cutoff_date: cutoffDate.toISOString(),
      target_user_id: user_id,
    };

    // Call Python worker cleanup endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for cleanup operations
    
    try {
      const workerResponse = await fetch(`${backendConfig.endpoint}/api/notifications/cleanup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          older_than_days,
          batch_size,
          dry_run,
          user_id,
          cleanup_metadata: cleanupMetadata,
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
              message: rateLimitData.detail?.message || "Maximum cleanup requests exceeded",
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
      
      const data: NotificationCleanupResponse = await workerResponse.json();
      
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
      console.error("Python worker notification cleanup error:", workerError);
      
      return NextResponse.json({
        success: false,
        error: "Notification cleanup failed",
        message: "Unable to connect to cleanup service",
        circuit_breaker_state: getCircuitBreakerStatus(),
      }, {
        status: 503,
        headers: {
          'X-Circuit-Breaker-State': getCircuitBreakerStatus(),
        }
      });
    }

  } catch (error) {
    console.error("Error in notification cleanup:", error);

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
