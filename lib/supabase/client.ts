import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase Client Configuration
 *
 * Browser client for type-safe queries with Realtime support.
 */
export function createClient() {
    const isBrowser = typeof window !== 'undefined'

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
            ...(isBrowser && {
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                    },
                },
            }),
        }
    )
}
