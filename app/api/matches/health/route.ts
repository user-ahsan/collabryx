/**
 * Match Service Health Check API Route
 * Performs direct health checks for Supabase, match service, and embedding service
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getBackendConfig, getCircuitBreakerStatus, clearHealthCache } from "@/lib/config/backend";
import { generateMatchesForUser } from "@/lib/services/match-generator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  backend_available: boolean;
  backend_mode: string;
  circuit_breaker_state: "closed" | "open" | "half-open";
  response_time_ms?: number;
  database_connected: boolean;
  match_service_available: boolean;
  error?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get backend configuration (for embedding service health)
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    // Check 1: Supabase connectivity — query profiles table
    let supabaseHealthy = false;
    try {
      const { error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      supabaseHealthy = !error;
    } catch {
      supabaseHealthy = false;
    }
    
    // Check 2: Match service availability — verify module loads
    const matchServiceAvailable = typeof generateMatchesForUser === "function";
    
    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let errorMessage: string | undefined;
    
    if (!supabaseHealthy) {
      status = "unhealthy";
      errorMessage = "Database connection failed";
    } else if (!backendConfig.isHealthy) {
      status = "degraded";
      errorMessage = "Embedding service unavailable";
    }
    
    const responseTime = Date.now() - startTime;
    
    const response: HealthCheckResponse = {
      status,
      backend_available: !!backendConfig.endpoint,
      backend_mode: backendConfig.mode,
      circuit_breaker_state: circuitBreakerState,
      response_time_ms: responseTime,
      database_connected: supabaseHealthy,
      match_service_available: matchServiceAvailable,
      error: errorMessage,
    };

    // Check if refresh is requested
    const refresh = request.nextUrl.searchParams.get("refresh");
    if (refresh === "true") {
      clearHealthCache();
      response.message = "Health cache cleared";
    }

    return NextResponse.json(response, {
      status: status === "healthy" ? 200 : 503,
      headers: {
        'X-Circuit-Breaker-State': circuitBreakerState,
        'X-Backend-Mode': backendConfig.mode,
        'X-Response-Time': `${responseTime}ms`,
      },
    });

  } catch (error) {
    console.error("Health check error:", error);
    
    const errorResponse: HealthCheckResponse = {
      status: "unhealthy",
      backend_available: false,
      backend_mode: "unknown",
      circuit_breaker_state: getCircuitBreakerStatus(),
      response_time_ms: Date.now() - startTime,
      database_connected: false,
      match_service_available: false,
      error: error instanceof Error ? error.message : "Health check failed",
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'X-Circuit-Breaker-State': errorResponse.circuit_breaker_state,
      },
    });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
