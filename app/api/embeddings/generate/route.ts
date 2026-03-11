import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { user_id: targetUserId } = await request.json();
    
    // Verify target user is the authenticated user
    const userId = targetUserId || user.id;
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

    // Call the Edge Function to generate embedding
    const { data, error } = await supabase.functions.invoke("generate-embedding", {
      body: { user_id: userId },
    });

    if (error) {
      console.error("Edge Function error:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to generate embedding" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in embeddings generate:", error);
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
