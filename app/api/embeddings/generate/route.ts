import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
    // Pad embedding to 768 dimensions to match database schema
    const targetDimensions = 768;
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
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let userId = user.id;

  try {
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id;
    
    // Verify target user is the authenticated user
    userId = targetUserId || user.id;
    if (userId !== user.id) {
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

    const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || "http://localhost:8000";

    // Call Python worker to generate embedding
    const workerResponse = await fetch(`${PYTHON_WORKER_URL}/generate-embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: semanticText,
        user_id: userId,
        request_id: crypto.randomUUID(),
      }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      await updateEmbeddingStatus(supabase, userId, "failed");
      throw new Error(`Python worker error: ${workerResponse.status} - ${errorText}`);
    }

    const embeddingData: EmbeddingResponse = await workerResponse.json();

    // Store embedding in database
    await updateEmbeddingStatus(
      supabase,
      userId,
      "completed",
      embeddingData.embedding
    );

    // Return success response
    return NextResponse.json({
        success: true,
        message: "Embedding generated successfully",
        data: {
          user_id: userId,
          dimensions: embeddingData.dimensions,
          model: embeddingData.model,
          status: "completed",
          processing_time_ms: embeddingData.processing_time_ms,
        },
    });

  } catch (error) {
    console.error("Error in embeddings generate:", error);
    
    // Mark as failed
    try {
        await updateEmbeddingStatus(supabase, userId, "failed");
    } catch (e) {
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
