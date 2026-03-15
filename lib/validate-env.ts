import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url(),
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
  
  console.log('✅ Environment validation passed')
  return result.data
}

// Auto-validate in production
if (process.env.NODE_ENV === 'production') {
  validateEnv()
}
