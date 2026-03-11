// Collabryx Generate Embedding Edge Function
// Generates vector embeddings for user profiles using Python worker service

// @ts-ignore - Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Supabase client import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// Deno environment variables
const getEnv = (key: string): string => {
  // @ts-ignore - Deno global
  return Deno.env.get(key) || "";
};

const PYTHON_WORKER_URL = getEnv("PYTHON_WORKER_URL") || "http://localhost:8000";

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

interface EmbeddingRequest {
  user_id?: string;
}

interface EmbeddingResponse {
  user_id: string;
  embedding: number[];
  dimensions: number;
  model: string;
  status: string;
  processing_time_ms: number;
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
  supabase: any,
  userId: string,
  status: string,
  embedding?: number[]
): Promise<void> {
  const updateData: any = {
    user_id: userId,
    status: status,
    last_updated: new Date().toISOString(),
  };

  if (embedding) {
    updateData.embedding = embedding;
  }

  const { error } = await supabase
    .from("profile_embeddings")
    .upsert(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating embedding status:", error);
  }
}

// Main request handler
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json() as EmbeddingRequest;
    const targetUserId = body.user_id || user.id;

    // Verify target user exists and is the authenticated user (or allowed)
    if (targetUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Cannot generate embedding for other users" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Start processing
    await updateEmbeddingStatus(supabase, targetUserId, "processing");

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileError || !profile) {
      await updateEmbeddingStatus(supabase, targetUserId, "failed");
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user skills
    const { data: skills } = await supabase
      .from("user_skills")
      .select("skill_name, proficiency")
      .eq("user_id", targetUserId);

    // Fetch user interests
    const { data: interests } = await supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", targetUserId);

    // Construct semantic text
    const semanticText = constructSemanticText(
      profile as ProfileData,
      skills || [],
      interests || []
    );

    // Call Python worker to generate embedding
    const workerResponse = await fetch(`${PYTHON_WORKER_URL}/generate-embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: semanticText,
        user_id: targetUserId,
        request_id: crypto.randomUUID(),
      }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      await updateEmbeddingStatus(supabase, targetUserId, "failed");
      throw new Error(`Python worker error: ${workerResponse.status} - ${errorText}`);
    }

    const embeddingData: EmbeddingResponse = await workerResponse.json();

    // Store embedding in database
    await updateEmbeddingStatus(
      supabase,
      targetUserId,
      "completed",
      embeddingData.embedding
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Embedding generated successfully",
        data: {
          user_id: targetUserId,
          dimensions: embeddingData.dimensions,
          model: embeddingData.model,
          status: "completed",
          processing_time_ms: embeddingData.processing_time_ms,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in generate-embedding:", error);

    // Mark as failed if we have the user ID
    try {
      const body = await req.json() as EmbeddingRequest;
      const userId = body?.user_id;
      if (userId) {
        const supabase = createClient(
          getEnv("SUPABASE_URL"),
          getEnv("SUPABASE_SERVICE_ROLE_KEY")
        );
        await updateEmbeddingStatus(supabase, userId, "failed");
      }
    } catch (e) {
      // Ignore
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
