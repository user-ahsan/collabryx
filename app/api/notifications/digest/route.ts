/**
 * Notification Digest API Route
 * Calls notification-engine service directly for daily digest sending
 * Admin-only access
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notificationClient } from "@/lib/worker-client";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from '@/lib/utils/api-response';

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

  // Check admin role from profiles table (database-backed, not user-controlled metadata)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { isAdmin: false, error: "Admin access required" };
  }

  if (profile.role === 'admin') {
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
      return errorResponse('INVALID_CSRF', 'Invalid CSRF token', 403)
    }
  }
  
  const supabase = await createClient();
  
  // Check admin access
  const adminCheck = await checkAdminAccess(supabase);
  if (!adminCheck.isAdmin) {
    return errorResponse('FORBIDDEN', adminCheck.error || 'Admin access required', 403)
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
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400)
    }
    
    const { date, batch_size, dry_run } = validationResult.data;
    
    // Prepare schedule metadata
    const scheduleMetadata = {
      triggered_at: new Date().toISOString(),
      triggered_by: adminCheck.userId,
      date_range: date ? {
        start: date,
        end: date,
      } : undefined,
    };

    const result = await notificationClient.generateDigest({
      date,
      batchSize: batch_size,
      dryRun: dry_run,
    });

    return NextResponse.json({
      success: true,
      data: {
        digests_queued: result.digestsQueued,
        digests_sent: result.digestsSent,
        digests_failed: result.digestsFailed,
        status: result.digestsFailed === 0 ? 'completed' : 'partial',
        backend_mode: 'native',
        schedule_metadata: scheduleMetadata,
      },
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined,
    });

  } catch (error) {
    console.error("Error in notification digest:", error);

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
