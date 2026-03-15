import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PYTHON_WORKER_URL: z.string().url().optional(),
  BACKEND_MODE: z.enum(['auto', 'docker', 'render', 'edge-only']).optional(),
  BACKEND_URL_DOCKER: z.string().url().optional(),
  BACKEND_URL_RENDER: z.string().url().optional(),
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
  
  if (backendMode !== 'edge-only') {
    if (backendMode === 'docker' && !process.env.BACKEND_URL_DOCKER) {
      console.warn('⚠️ BACKEND_MODE=docker but BACKEND_URL_DOCKER not set')
    }
    if (backendMode === 'render' && !process.env.BACKEND_URL_RENDER) {
      console.warn('⚠️ BACKEND_MODE=render but BACKEND_URL_RENDER not set')
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

// Runtime validation helper for production
export async function validateEnvRuntime() {
  if (process.env.NODE_ENV === 'production') {
    validateEnv()
  }
}

// Only validate at runtime, not during build
// Vercel sets environment variables at runtime, not build time
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Client-side validation in production
  validateEnv()
}
