/**
 * Notification Send API Route
 * Calls notification-engine service directly for single notification delivery
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNotification } from "@/lib/services/notification-engine";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from '@/lib/utils/api-response';

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

  // Apply rate limiting (20 requests per hour per user)
  const rateLimitResult = rateLimit(request, 'embeddings');
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = NotificationSendRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400)
    }
    
    const { user_id, type, content, actor_id, actor_name, actor_avatar, resource_type, resource_id } = validationResult.data;

    // Authorization: the authenticated user must match actor_id
    // Prevents impersonation — only the acting user can send as themselves
    if (actor_id && actor_id !== user.id) {
      return errorResponse('FORBIDDEN', 'Cannot send notifications as another user', 403)
    }
    
    // Verify recipient exists
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", user_id)
      .single();

    if (!recipient) {
      return errorResponse('NOT_FOUND', 'Recipient not found', 404)
    }

    // Verify actor exists if provided
    if (actor_id) {
      const { data: actor } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", actor_id)
        .single();

      if (!actor) {
        return errorResponse('NOT_FOUND', 'Actor not found', 404)
      }
    }

    // Send notification via notification-engine service with caller authorization
    const result = await sendNotification({
      userId: user_id,
      type,
      content,
      actorId: actor_id,
      actorName: actor_name,
      actorAvatar: actor_avatar,
      resourceType: resource_type,
      resourceId: resource_id,
    }, { callerId: user.id });

    return NextResponse.json({
      success: result.success,
      data: result.success
        ? {
            notification_id: result.notificationId,
            user_id: user_id,
            type,
            status: "sent" as const,
            backend_mode: "native",
          }
        : undefined,
      error: result.error,
    });

  } catch (error) {
    console.error("Error in notification send:", error);

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
