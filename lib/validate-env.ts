import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PYTHON_WORKER_URL: z.string().url().optional(),
  BACKEND_MODE: z.enum(['auto', 'docker', 'render', 'edge-only']).optional(),
  BACKEND_DOMAIN: z.string().min(3).optional(),
  BACKEND_URL_DOCKER: z.string().url().optional(),
  BACKEND_URL_RENDER: z.string().url().optional(), // deprecated — use BACKEND_DOMAIN or individual URLs
  // In production, service URLs resolve in priority order:
  //   1. Individual per-service env var (EMBEDDING_SERVICE_URL, etc.)
  //   2. BACKEND_DOMAIN — derives all 4 URLs (e.g. embedding.ahsanali.cc)
  //  In dev, always uses Docker/localhost
  EMBEDDING_SERVICE_URL: z.string().url().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
  FEED_SERVICE_URL: z.string().url().optional(),
  MATCH_SERVICE_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
})

export function validateEnv() {
  const result = EnvSchema.safeParse(process.env)
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.format())
    throw new Error('Invalid environment configuration')
  }
  
  const env = result.data
  
  // Validate required Supabase variables
  const requiredInAllEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const missingRequired = requiredInAllEnvs.filter(
    key => !process.env[key]
  )
  
  if (missingRequired.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingRequired.join(', ')}`
    console.error('❌ ENV VALIDATION FAILED:', errorMsg)
    throw new Error(errorMsg)
  }
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL must start with https://')
    throw new Error('Invalid Supabase URL format')
  }
  
  // Validate Python worker configuration
  const backendMode = process.env.BACKEND_MODE || 'auto'
  
  // In production on Vercel, we need at least one way to reach microservices
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    const hasMicroserviceConfig = !!(process.env.BACKEND_DOMAIN
      || process.env.EMBEDDING_SERVICE_URL
      || process.env.NEXT_PUBLIC_WORKER_API_URL
      || process.env.BACKEND_URL_RENDER)
    if (!hasMicroserviceConfig) {
      console.warn('⚠️ No backend URL configured for production. Set BACKEND_DOMAIN (e.g. ahsanali.cc) or individual EMBEDDING_SERVICE_URL etc.')
    }
  }

  if (backendMode !== 'edge-only') {
    if (backendMode === 'docker' && !process.env.BACKEND_URL_DOCKER) {
      console.warn('⚠️ BACKEND_MODE=docker but BACKEND_URL_DOCKER not set')
    }
    if (backendMode === 'render' && !process.env.EMBEDDING_SERVICE_URL && !process.env.BACKEND_URL_RENDER) {
      console.warn('⚠️ BACKEND_MODE=render but EMBEDDING_SERVICE_URL not set')
    }
  }
  
  // Validate Python worker URL if provided
  const pythonWorkerUrl = process.env.PYTHON_WORKER_URL
  if (pythonWorkerUrl && !pythonWorkerUrl.startsWith('http')) {
    console.warn('⚠️ PYTHON_WORKER_URL should start with http:// or https://')
  }
  
  console.log('✅ Environment validation passed')
  console.log('📋 Configuration:', {
    supabase: supabaseUrl ? '✓' : '✗',
    backendMode,
    pythonWorker: pythonWorkerUrl ? '✓' : '✗',
  })
  
  return env
}

// Runtime validation helper for all environments
export async function validateEnvRuntime() {
  validateEnv()
}

// Server-side only - environment validation should only run on server
// Client-side code should never validate server-only env vars like SUPABASE_SERVICE_ROLE_KEY
