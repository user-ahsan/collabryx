// Collabryx Generate Embedding Edge Function
// Generates vector embeddings using Hugging Face Inference API (production-ready)

// @ts-ignore - Deno std library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Supabase client import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// Deno environment variables
const getEnv = (key: string): string => {
  // @ts-ignore - Deno global
  return Deno.env.get(key) || "";
};

const HF_API_KEY = getEnv("HF_API_KEY");
const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

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
    // Ensure embedding is 384 dimensions
    let processedEmbedding = embedding;
    if (embedding.length < 384) {
      processedEmbedding = [
        ...embedding,
        ...Array(384 - embedding.length).fill(0),
      ];
    } else if (embedding.length > 384) {
      processedEmbedding = embedding.slice(0, 384);
    }
    updateData.embedding = processedEmbedding;
  }

  const { error } = await supabase
    .from("profile_embeddings")
    .upsert(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating embedding status:", error);
  }
}

// Call Hugging Face Inference API
async function callHuggingFace(text: string): Promise<number[] | null> {
  if (!HF_API_KEY) {
    console.log("No HF_API_KEY, skipping Hugging Face API");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
            use_cache: true,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      console.error(`HF API error: ${response.status} - ${JSON.stringify(error)}`);
      return null;
    }

    const result = await response.json();
    
    // HF returns [{ "embedding": [384 floats] }]
    if (Array.isArray(result) && result[0]?.embedding) {
      return result[0].embedding;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to call Hugging Face API:", error);
    return null;
  }
}

// Local embedding generation using Transformers.js (fallback)
async function generateLocalEmbedding(text: string): Promise<number[]> {
  // Simple TF-IDF style embedding as fallback
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const embedding = new Array(384).fill(0);
  
  // Simple hash-based word to vector mapping
  for (let i = 0; i < words.length && i < 384; i++) {
    let hash = 0;
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash = hash & hash;
    }
    embedding[i] = Math.sin(hash) / Math.sqrt(384);
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < 384; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
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

    // Verify target user exists and is the authenticated user
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

    const startTime = Date.now();
    let embedding: number[] | null = null;
    let usedMethod = "unknown";

    // Try Hugging Face API first (best quality, no infrastructure)
    if (HF_API_KEY) {
      console.log("Using Hugging Face Inference API");
      embedding = await callHuggingFace(semanticText);
      if (embedding) {
        usedMethod = "huggingface-api";
      }
    }

    // Fallback to local generation if HF API failed
    if (!embedding) {
      console.log("Using local embedding generation fallback");
      usedMethod = "local-tfidf-fallback";
      embedding = await generateLocalEmbedding(semanticText);
    }

    const processingTimeMs = Date.now() - startTime;

    // Store embedding in database
    await updateEmbeddingStatus(
      supabase,
      targetUserId,
      "completed",
      embedding
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Embedding generated using ${usedMethod}`,
        data: {
          user_id: targetUserId,
          dimensions: 384,
          model: usedMethod === "huggingface-api" ? HF_MODEL : "local-tfidf-fallback",
          status: "completed",
          processing_time_ms: processingTimeMs,
          used_fallback: usedMethod === "local-tfidf-fallback",
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
