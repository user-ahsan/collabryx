/**
 * Environment Configuration
 * Centralizes all env var access with dev/prod detection
 */

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

async function isRunningInDocker(): Promise<boolean> {
  if (process.env.IN_DOCKER_CONTAINER === 'true') return true
  try {
    const fs = await import('fs')
    fs.statSync('/.dockerenv')
    return true
  } catch {
    return false
  }
}

const inDocker = await isRunningInDocker()

export const config = {
  environment: isProduction ? 'production' : isDevelopment ? 'development' : 'development',
  isProduction,
  isDevelopment: !isProduction,

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  worker: {
    url: process.env.NEXT_PUBLIC_WORKER_API_URL ||
        (inDocker ? 'http://host.docker.internal:8000' : 'http://localhost:8000'),
    healthUrl: (process.env.NEXT_PUBLIC_WORKER_API_URL ||
        (inDocker ? 'http://host.docker.internal:8000' : 'http://localhost:8000')) + '/health',
  },

  redis: {
    url: process.env.REDIS_URL ||
        (inDocker ? 'redis://host.docker.internal:6379' : 'localhost:6379'),
    password: process.env.REDIS_PASSWORD || '',
  },

  features: {
    enableAI: Boolean(process.env.HF_API_KEY),
    enableRealtime: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    enableWorker: Boolean(process.env.NEXT_PUBLIC_WORKER_API_URL || !isProduction),
  },
} as const

export type Config = typeof config
