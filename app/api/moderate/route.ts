/**
 * Content Moderation API Route
 * Proxies requests to Python worker for content moderation
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const ModerateRequestSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  content_type: z.enum(["post", "comment", "message", "profile"]).default("post"),
});

export interface ModerateResponse {
  approved: boolean;
  flag_for_review: boolean;
  auto_reject: boolean;
  risk_score: number;
  action: "approved" | "flag_for_review" | "auto_reject";
  details: {
    toxicity?: { score: number };
    spam?: { score: number };
    nsfw?: { score: number };
    pii?: { detected: boolean; types: string[] };
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
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }
  
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = ModerateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request body",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const backendConfig = await getBackendConfig();
    
    if (!backendConfig.endpoint) {
      // Fallback: Basic keyword-based moderation
      const fallbackResult = await fallbackModeration(validationResult.data.content);
      return NextResponse.json(fallbackResult);
    }

    // Call Python worker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const workerResponse = await fetch(`${backendConfig.endpoint}/api/moderate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationResult.data),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!workerResponse.ok) {
      throw new Error(`Python worker error: ${workerResponse.status}`);
    }
    
    const data: ModerateResponse = await workerResponse.json();
    
    return NextResponse.json(data);
    
  } catch {
    console.error("Moderation API error:", error);
    
    // Fallback to basic moderation on error
    const fallbackResult = await fallbackModeration(request.body ? String(request.body) : "");
    fallbackResult.error = "Using fallback moderation (service unavailable)";
    
    return NextResponse.json(fallbackResult);
  }
}

/**
 * Fallback moderation using keyword matching
 * Used when Python worker is unavailable
 */
async function fallbackModeration(content: string): Promise<ModerateResponse> {
  const lowerContent = content.toLowerCase();
  
  const toxicKeywords = [
    'stupid', 'idiot', 'hate', 'kill', 'die', 'suck',
    'worthless', 'garbage', 'trash', 'loser', 'idiot'
  ];
  
  const spamPatterns = [
    /buy now/i,
    /click here/i,
    /limited time/i,
    /discount/i,
    /free money/i,
    /winner/i,
    /congratulations/i,
  ];
  
  const piiPatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    phone: /\b(?:\+?1[-.\s]?)?\(?(?:[0-9]{3})\)?[-.\s]?(?:[0-9]{3})[-.\s]?(?:[0-9]{4})\b/,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  };
  
  // Calculate scores
  const toxicCount = toxicKeywords.filter(word => lowerContent.includes(word)).length;
  const toxicityScore = Math.min(1.0, toxicCount / 5);
  
  const spamCount = spamPatterns.filter(pattern => pattern.test(content)).length;
  const spamScore = Math.min(1.0, spamCount / 3);
  
  const piiDetected = Object.entries(piiPatterns).some(([, pattern]) => pattern.test(content));
  const piiTypes = Object.entries(piiPatterns)
    .filter(([, pattern]) => pattern.test(content))
    .map(([type]) => type);
  
  // Calculate risk score
  const riskScore = (
    toxicityScore * 0.4 +
    spamScore * 0.2 +
    (piiDetected ? 0.4 : 0)
  );
  
  // Determine action
  let action: "approved" | "flag_for_review" | "auto_reject" = "approved";
  if (riskScore >= 0.7 || toxicityScore >= 0.7 || spamScore >= 0.8 || piiDetected) {
    action = "auto_reject";
  } else if (riskScore >= 0.3) {
    action = "flag_for_review";
  }
  
  return {
    approved: action === "approved",
    flag_for_review: action === "flag_for_review",
    auto_reject: action === "auto_reject",
    risk_score: Math.round(riskScore * 100) / 100,
    action,
    details: {
      toxicity: { score: Math.round(toxicityScore * 100) / 100 },
      spam: { score: Math.round(spamScore * 100) / 100 },
      nsfw: { score: 0 },
      pii: { detected: piiDetected, types: piiTypes },
    },
  };
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
