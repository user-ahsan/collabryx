/**
 * Explore/Discover Profiles API Route
 * Returns a list of other users for new users to discover when they have no matches yet
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ExploreQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  skill: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = ExploreQuerySchema.safeParse({
    limit: searchParams.get("limit") || 20,
    skill: searchParams.get("skill") || undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  try {
    let dbQuery = supabase
      .from("profiles")
      .select(`
        id, full_name, display_name, headline, bio, location, avatar_url,
        collaboration_readiness, is_verified, profile_completion, created_at,
        skills:user_skills!inner(skill_name, proficiency, is_primary)
      `)
      .not("id", "eq", user.id)
      .gte("profile_completion", 20)
      .order("profile_completion", { ascending: false })
      .limit(query.data.limit);

    if (query.data.skill) {
      dbQuery = dbQuery.contains("skills.skill_name", [query.data.skill]);
    }

    const { data: profiles, error } = await dbQuery;

    if (error) throw error;

    const mapped = (profiles || []).map(p => ({
      id: p.id,
      name: p.display_name || p.full_name || "Unknown",
      headline: p.headline || "",
      avatar_url: p.avatar_url || "",
      bio: p.bio || "",
      location: p.location || "",
      collaboration_readiness: p.collaboration_readiness || "available",
      is_verified: p.is_verified || false,
      profile_completion: p.profile_completion || 0,
      skills: (p.skills || []).map((s: { skill_name: string; proficiency: string | null; is_primary: boolean | null }) => ({
        name: s.skill_name,
        proficiency: s.proficiency,
        is_primary: s.is_primary,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error("Error fetching explore profiles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
