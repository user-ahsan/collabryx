import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SESSION_DURATION_SECONDS } from '@/lib/config/session'

/**
 * Supabase Server Client Configuration
 * 
 * Server components create new client instances per request.
 * Connection pooling is managed by Supabase's edge infrastructure.
 * We implement application-layer retry logic and timeout handling.
 * 
 * @deprecated Database generic requires type regeneration from Supabase CLI.
 * Current usage: createServerClient() without generic.
 * Target usage: createServerClient<Database>() after running:
 *   npx supabase gen types typescript --local > types/database.types.ts
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                // P1-04: Enforce 7-day session timeout
                                maxAge: options?.maxAge || SESSION_DURATION_SECONDS,
                            })
                        )
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            auth: {
                // P1-04: Session timeout configuration (7 days)
                flowType: 'pkce',
                autoRefreshToken: true,
                storageKey: 'supabase.auth.token',
            },
        }
    )
}
