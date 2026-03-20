import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SESSION_DURATION_SECONDS } from '@/lib/config/session'

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
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                // P1-04: Enforce 7-day session timeout
                                maxAge: options?.maxAge || SESSION_DURATION_SECONDS,
                            })
                        )
                    } catch {
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
            },
        }
    )
}
