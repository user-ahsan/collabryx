import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/database.types"

/**
 * Supabase Client Configuration
 *
 * Browser client configured with Database generic for type-safe queries.
 */
export function createClient() {
    return createBrowserClient<Database>(
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
        }
    )
}
