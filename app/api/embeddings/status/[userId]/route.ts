import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Await the params Promise
  const { userId } = await params;

  // Users can only check their own embedding status
  if (userId !== user.id) {
    return NextResponse.json(
      { error: "Cannot check embedding status for other users" },
      { status: 403 }
    );
  }

  try {
    // Get embedding status using the helper function
    const { data, error } = await supabase
      .rpc("get_embedding_status", { user_id: userId });

    if (error) {
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .from("profile_embeddings")
        .select("user_id, status, last_updated")
        .eq("user_id", userId)
        .single();

      if (directError && directError.code !== "PGRST116") {
        console.error("Error fetching embedding status:", directError);
        return NextResponse.json(
          { error: "Failed to fetch status" },
          { status: 500 }
        );
      }

      if (!directData) {
        return NextResponse.json({
          user_id: userId,
          status: "not_found",
          last_updated: null,
          has_embedding: false
        });
      }

      return NextResponse.json({
        ...directData,
        has_embedding: directData.status === "completed"
      });
    }

    // Return the status from the RPC function
    const status = data?.[0] || null;
    if (!status) {
      return NextResponse.json({
        user_id: userId,
        status: "not_found",
        last_updated: null,
        has_embedding: false
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error in embeddings status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
