import { createBrowserClient } from "@supabase/ssr"
import { getSupabasePoolConfig } from '@/lib/config/database'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // P1-04: Session timeout configuration (7 days)
                flowType: 'pkce',
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'supabase.auth.token',
            },
            // P1-11: Database connection pooling configuration
            db: getSupabasePoolConfig(),
        }
    )
}
