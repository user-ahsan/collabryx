/**
 * Match Service Health Check API Route
 * Proxies health check requests to Python worker match service
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getBackendConfig, getCircuitBreakerStatus, clearHealthCache } from "@/lib/config/backend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  backend_available: boolean;
  backend_mode: string;
  circuit_breaker_state: "closed" | "open" | "half-open";
  response_time_ms?: number;
  worker_health?: {
    status: string;
    model_info?: {
      model_name: string;
      dimensions: number;
      device: string;
    };
    supabase_connected: boolean;
    queue_size?: number;
  };
  database_connected: boolean;
  error?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if user is authenticated (optional, can be removed for public health checks)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get backend configuration
    const backendConfig = await getBackendConfig();
    const circuitBreakerState = getCircuitBreakerStatus();
    
    const response: HealthCheckResponse = {
      status: "healthy",
      backend_available: !!backendConfig.endpoint,
      backend_mode: backendConfig.mode,
      circuit_breaker_state: circuitBreakerState,
      database_connected: true,
    };

    // If backend is available, check worker health
    if (backendConfig.endpoint) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const workerResponse = await fetch(`${backendConfig.endpoint}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const responseTime = Date.now() - startTime;
        response.response_time_ms = responseTime;
        
        if (workerResponse.ok) {
          const workerHealth = await workerResponse.json();
          response.worker_health = workerHealth;
          
          // Determine overall status
          if (workerHealth.status === "healthy" && backendConfig.isHealthy) {
            response.status = "healthy";
          } else if (workerHealth.status === "unhealthy" || !backendConfig.isHealthy) {
            response.status = "degraded";
          }
        } else {
          response.status = "degraded";
          response.error = `Worker health check failed: ${workerResponse.status}`;
        }
        
      } catch (workerError) {
        response.status = "degraded";
        response.error = `Worker health check failed: ${workerError instanceof Error ? workerError.message : "Unknown error"}`;
        response.response_time_ms = Date.now() - startTime;
      }
    } else {
      response.status = "degraded";
      response.error = "Python worker backend not available";
    }

    // Check if refresh is requested
    const refresh = request.nextUrl.searchParams.get("refresh");
    if (refresh === "true") {
      clearHealthCache();
      response.message = "Health cache cleared";
    }

    return NextResponse.json(response, {
      status: response.status === "healthy" ? 200 : 503,
      headers: {
        'X-Circuit-Breaker-State': circuitBreakerState,
        'X-Backend-Mode': backendConfig.mode,
        'X-Response-Time': `${response.response_time_ms || 0}ms`,
      },
    });

  } catch {
    console.error("Health check error:", error);
    
    const errorResponse: HealthCheckResponse = {
      status: "unhealthy",
      backend_available: false,
      backend_mode: "unknown",
      circuit_breaker_state: getCircuitBreakerStatus(),
      database_connected: false,
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
