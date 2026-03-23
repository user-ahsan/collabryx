import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

/**
 * Supabase Client Configuration
 * 
 * Note: Browser client uses HTTP REST API (not direct DB connections).
 * Connection pooling is managed by Supabase server-side.
 * We configure fetch timeouts and retry logic at the application layer.
 * 
 * @deprecated Database generic requires type regeneration from Supabase CLI.
 * Current usage: createBrowserClient() without generic.
 * Target usage: createBrowserClient<Database>() after running:
 *   npx supabase gen types typescript --local > types/database.types.ts
 */
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
        }
    )
}
