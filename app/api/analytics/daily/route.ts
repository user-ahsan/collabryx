/**
 * Analytics Daily Aggregation API Route
 * Proxies requests to Python worker for daily analytics aggregation
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig } from "@/lib/config/backend";

export const dynamic = "force-dynamic";

const AnalyticsDailyRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD").optional(),
});

export interface AnalyticsDailyResponse {
  status: "success" | "error";
  date: string;
  metrics: {
    dau?: number;
    mau?: number;
    wau?: number;
    new_users?: number;
    new_posts?: number;
    new_matches?: number;
    new_connections?: number;
    new_messages?: number;
    content_flagged?: number;
    [key: string]: number | undefined;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is admin (you can customize this logic)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  const isAdmin = userProfile?.role === "admin" || process.env.NODE_ENV === "development";
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = AnalyticsDailyRequestSchema.safeParse(body);
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
      // Fallback: Basic analytics from database
      const fallbackResult = await fallbackAnalytics(validationResult.data.date);
      return NextResponse.json(fallbackResult);
    }

    // Call Python worker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const workerResponse = await fetch(`${backendConfig.endpoint}/api/analytics/daily`, {
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
    
    const data: AnalyticsDailyResponse = await workerResponse.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Analytics API error:", error);
    
    // Fallback to basic analytics
    const fallbackResult = await fallbackAnalytics(request.body ? String(request.body) : undefined);
    fallbackResult.error = "Using fallback analytics (service unavailable)";
    
    return NextResponse.json(fallbackResult);
  }
}

/**
 * Fallback analytics calculation
 * Used when Python worker is unavailable
 */
async function fallbackAnalytics(dateStr?: string): Promise<AnalyticsDailyResponse> {
  const supabase = await createClient();
  
  // Parse date or use today
  let targetDate: Date;
  if (dateStr) {
    targetDate = new Date(dateStr);
  } else {
    targetDate = new Date();
  }
  
  const date = targetDate.toISOString().split('T')[0];
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  
  const startOfLast7Days = new Date(startOfDay);
  startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);
  
  const startOfLast30Days = new Date(startOfDay);
  startOfLast30Days.setDate(startOfLast30Days.getDate() - 30);
  
  try {
    // DAU - Active today
    const dauResponse = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active", startOfDay.toISOString())
      .lt("last_active", endOfDay.toISOString());
    
    // WAU - Active in last 7 days
    const wauResponse = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active", startOfLast7Days.toISOString());
    
    // MAU - Active in last 30 days
    const mauResponse = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active", startOfLast30Days.toISOString());
    
    // New users today
    const newUsersResponse = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());
    
    // New posts today
    const newPostsResponse = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());
    
    // New matches today
    const newMatchesResponse = await supabase
      .from("match_suggestions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());
    
    // New connections today
    const newConnectionsResponse = await supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());
    
    // New messages today
    const newMessagesResponse = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());
    
    return {
      status: "success",
      date,
      metrics: {
        dau: dauResponse.count || 0,
        wau: wauResponse.count || 0,
        mau: mauResponse.count || 0,
        new_users: newUsersResponse.count || 0,
        new_posts: newPostsResponse.count || 0,
        new_matches: newMatchesResponse.count || 0,
        new_connections: newConnectionsResponse.count || 0,
        new_messages: newMessagesResponse.count || 0,
      },
    };
  } catch (error) {
    console.error("Fallback analytics error:", error);
    return {
      status: "error",
      date,
      metrics: {},
      error: "Failed to calculate analytics",
    };
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
