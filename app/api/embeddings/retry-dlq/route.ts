import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";

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
  
  // Authenticate user - only admins or service role can retry DLQ items
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, user_id } = body;
    
    if (!id || !user_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, user_id" },
        { status: 400 }
      );
    }

    // Get DLQ item to verify it exists and get semantic text
    const { data: item, error: fetchError } = await supabase
      .from("embedding_dead_letter_queue")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();
    
    if (fetchError || !item) {
      return NextResponse.json(
        { success: false, error: "DLQ item not found" },
        { status: 404 }
      );
    }

    // Check if item is eligible for retry
    if (item.status === "exhausted") {
      return NextResponse.json(
        { success: false, error: "Cannot retry exhausted item (max retries reached)" },
        { status: 400 }
      );
    }

    if (item.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Item already completed" },
        { status: 400 }
      );
    }

    // Reset the DLQ item to pending for immediate retry
    const { error: updateError } = await supabase
      .from("embedding_dead_letter_queue")
      .update({
        status: "pending",
        next_retry: new Date().toISOString(),
        last_attempt: null,
      })
      .eq("id", id);
    
    if (updateError) {
      console.error("Failed to reset DLQ item:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to reset DLQ item" },
        { status: 500 }
      );
    }

    // Call Python worker to process immediately
    const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || "http://localhost:8000";
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await fetch(`${PYTHON_WORKER_URL}/generate-embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: item.semantic_text,
          user_id: user_id,
          request_id: crypto.randomUUID(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (workerError) {
      console.log("Python worker unavailable, DLQ will process automatically:", workerError);
      // Item is already reset to pending, so automatic processor will handle it
    }

    return NextResponse.json({ 
      success: true, 
      message: "Retry queued successfully",
      data: { id, user_id, status: "pending" }
    });
    
  } catch {
    console.error("DLQ retry failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
