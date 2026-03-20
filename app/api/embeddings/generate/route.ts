import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig } from "@/lib/config/backend";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";

export const runtime = "edge"

export const dynamic = "force-dynamic"

const EmbeddingRequestSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format").optional(),
})

interface ProfileData {
  id: string;
  role?: string;
  headline?: string;
  bio?: string;
  looking_for?: string[];
  location?: string;
}

interface SkillData {
  skill_name: string;
  proficiency?: string;
}

interface InterestData {
  interest: string;
}

// Helper function to construct semantic text from profile data
function constructSemanticText(
  profile: ProfileData,
  skills: SkillData[],
  interests: InterestData[]
): string {
  const skillsText = skills.length > 0
    ? skills.map(s => s.skill_name).join(', ')
    : 'None';

  const interestsText = interests.length > 0
    ? interests.map(i => i.interest).join(', ')
    : 'None';

  const goalsText = profile.looking_for && profile.looking_for.length > 0
    ? profile.looking_for.join(', ')
    : 'None';

  return `Role: ${profile.role || 'User'}.
Headline: ${profile.headline || ''}.
Bio: ${profile.bio || ''}.
Skills: ${skillsText}.
Interests: ${interestsText}.
Goals: ${goalsText}.
Location: ${profile.location || ''}.`.trim();
}

// Helper function to update embedding status in database
async function updateEmbeddingStatus(
  supabase: SupabaseClient,
  userId: string,
  status: string,
  embedding?: number[]
): Promise<void> {
  const updateData: Record<string, unknown> = {
    user_id: userId,
    status: status,
    last_updated: new Date().toISOString(),
  };

  if (embedding) {
    // Pad/slice to 384 dimensions to match database schema
    const targetDimensions = 384;
    if (embedding.length < targetDimensions) {
      updateData.embedding = [
        ...embedding,
        ...Array(targetDimensions - embedding.length).fill(0),
      ];
    } else if (embedding.length > targetDimensions) {
      updateData.embedding = embedding.slice(0, targetDimensions);
    } else {
      updateData.embedding = embedding;
    }
  }

  // Create admin client if service role key exists to bypass RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  let dbClient = supabase;
  
  if (serviceRoleKey) {
    dbClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
  }

  const { error } = await dbClient
    .from("profile_embeddings")
    .upsert(updateData, { onConflict: 'user_id' });

  if (error) {
    console.error("Error updating embedding status:", error);
  }
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
  
  // Get user - allow unverified emails for onboarding flow
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If user verification failed due to email not confirmed, get user from session instead
  let authenticatedUserId: string;
  if (authError && (authError.message.includes("Email not confirmed") || authError.message.includes("not confirmed"))) {
    // For onboarding, allow unverified users - get user from session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      authenticatedUserId = sessionData.session.user.id;
      console.log('📧 Unverified user allowed for embedding generation:', authenticatedUserId);
    } else {
      return NextResponse.json(
        { success: false, error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }
  } else if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  } else {
    authenticatedUserId = user.id;
  }

  // Declare userId at function scope so it's accessible in catch block
  let userId: string = authenticatedUserId;

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = EmbeddingRequestSchema.safeParse(body);
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
    
    const targetUserId = validationResult.data.user_id;
    
    // Use target user ID if provided, otherwise use authenticated user ID
    userId = targetUserId || authenticatedUserId;
    
    // Security check: users can only generate embeddings for themselves
    if (userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Cannot generate embedding for other users" },
        { status: 403 }
      );
    }

    // Check if embedding already exists and is completed
    const { data: existingEmbedding } = await supabase
      .from("profile_embeddings")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (existingEmbedding?.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Embedding already exists",
        data: {
          user_id: userId,
          status: "completed",
          note: "Use regenerate endpoint to refresh embedding"
        }
      });
    }

    // Start processing
    await updateEmbeddingStatus(supabase, userId, "processing");

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      await updateEmbeddingStatus(supabase, userId, "failed");
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch user skills
    const { data: skills } = await supabase
      .from("user_skills")
      .select("skill_name, proficiency")
      .eq("user_id", userId);

    // Fetch user interests
    const { data: interests } = await supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", userId);

    // Construct semantic text
    const semanticText = constructSemanticText(
      profile as ProfileData,
      skills || [],
      interests || []
    );

    // Try backend (Docker or Render) first
    let usedFallback = false
    const backendConfig = await getBackendConfig()
    
    if (backendConfig.endpoint) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
        
        const workerResponse = await fetch(`${backendConfig.endpoint}/generate-embedding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: semanticText,
            user_id: userId,
            request_id: crypto.randomUUID(),
          }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // Handle rate limit response
        if (workerResponse.status === 429) {
          const rateLimitData = await workerResponse.json()
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded",
              message: rateLimitData.detail?.message || "Maximum 3 embedding requests per hour",
              retry_after: rateLimitData.detail?.retry_after,
              reset_at: rateLimitData.detail?.reset_at,
              remaining: rateLimitData.detail?.remaining
            },
            {
              status: 429,
              headers: {
                'Retry-After': rateLimitData.detail?.retry_after?.toString() || '3600',
                'X-RateLimit-Remaining': rateLimitData.detail?.remaining?.toString() || '0',
                'X-RateLimit-Reset': rateLimitData.detail?.reset_at || ''
              }
            }
          )
        }
        
        if (!workerResponse.ok) {
          throw new Error(`Backend error: ${workerResponse.status}`)
        }
        
        // Return queued response immediately!
        return NextResponse.json({
          success: true,
          message: "Your profile is being analyzed. Vector embedding is queued!",
          data: { user_id: userId, status: "queued", backend: backendConfig.mode },
        })
        
      } catch (workerError) {
        console.log("Backend unavailable, using Edge Function fallback:", workerError)
        usedFallback = true
      }
    } else {
      console.log("Using Edge Function (backend mode: edge-only)")
      usedFallback = true
    }

    // Fallback: Call Supabase Edge Function
    if (usedFallback) {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ''}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!edgeResponse.ok) {
        const errorText = await edgeResponse.text();
        await updateEmbeddingStatus(supabase, userId, "failed");
        throw new Error(`Edge Function error: ${edgeResponse.status} - ${errorText}`);
      }

      const edgeData = await edgeResponse.json();
      
      return NextResponse.json({
        success: true,
        message: edgeData.message || "Embedding generated using fallback method",
        data: {
          user_id: userId,
          status: "completed",
          ...edgeData.data,
        },
      });
    }

    // Should not reach here
    await updateEmbeddingStatus(supabase, userId, "failed");
    return NextResponse.json(
      { success: false, error: "Embedding generation failed" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Error in embeddings generate:", error);
    
    // Mark as failed
    try {
        await updateEmbeddingStatus(supabase, userId, "failed");
    } catch {
        // Ignore
    }

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
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
