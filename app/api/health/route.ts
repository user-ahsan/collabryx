import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for monitoring and uptime checks
 * 
 * Returns comprehensive health status including:
 * - Database connectivity
 * - Python worker health
 * - Service version
 * 
 * @returns Health status JSON
 */
export async function GET() {
  const supabase = await createClient()
  
  // Check database connection
  const { error: dbError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .maybeSingle()
  
  // Check Python worker health
  let pythonWorkerHealthy = false
  let pythonWorkerError: string | null = null
  
  try {
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'
    const response = await fetch(`${workerUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })
    pythonWorkerHealthy = response.ok
    
    if (!response.ok) {
      pythonWorkerError = `Worker returned status ${response.status}`
    }
  } catch (error) {
    pythonWorkerHealthy = false
    pythonWorkerError = error instanceof Error ? error.message : 'Unknown error'
  }
  
  // Determine overall health status
  const isHealthy = !dbError && pythonWorkerHealthy
  const status = isHealthy ? 'healthy' : dbError ? 'degraded' : 'unhealthy'
  const statusCode = isHealthy ? 200 : dbError ? 200 : 503
  
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: dbError ? 'failed' : 'ok',
        error: dbError ? dbError.message : null,
      },
      pythonWorker: {
        status: pythonWorkerHealthy ? 'ok' : 'failed',
        error: pythonWorkerError,
      },
    },
    uptime: process.uptime(),
  }, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
