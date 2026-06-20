import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"
import { AuthSyncClient } from "./client"
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function AuthSyncPage() {
    let destination = "/dashboard"
    let needsEmbeddingWait = false

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        return redirect("/login?error=config")
    }
    
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return redirect("/login?error=auth")
        }
        
        // ===========================================
        // EMAIL VERIFICATION CHECK
        // Respect SKIP_EMAIL_VERIFICATION env var
        // Server components read runtime env vars correctly,
        // so this check is reliable. The skip state is also
        // passed as a search param to client components
        // to avoid build-time inlining issues with NEXT_PUBLIC_ vars.
        // ===========================================
        const skipEmailVerification = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === "true"
        if (!skipEmailVerification && !user.email_confirmed_at) {
            return redirect("/verify-email")
        }
        
        // When SKIP_EMAIL_VERIFICATION is active, auto-confirm the user's email
        // via Supabase Admin API. This ensures email_confirmed_at is set so that
        // any API route or service that checks it directly also works correctly.
        if (skipEmailVerification && !user.email_confirmed_at) {
            try {
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                if (serviceRoleKey) {
                    const adminClient = createSupabaseAdminClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        serviceRoleKey
                    )
                    await adminClient.auth.admin.updateUserById(user.id, {
                        email_confirm: true,
                    })
                }
            } catch (confirmError) {
                // Non-fatal: if auto-confirm fails, the app-level skip flag will
                // still prevent verification redirects for the current session
                console.error('Auto email confirm failed:', confirmError)
            }
        }
        
        // Check profile — use maybeSingle() to avoid PGRST116 crash
        // when no profile row exists yet (e.g., just registered, trigger hasn't fired)
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, profile_completion")
            .eq("id", user.id)
            .maybeSingle()

        if (profile?.onboarding_completed === true) {
            destination = "/dashboard"
            
            const { data: embedding } = await supabase
                .from("profile_embeddings")
                .select("status")
                .eq("user_id", user.id)
                .single()
            
            if (!embedding || embedding.status === 'processing' || embedding.status === 'pending') {
                needsEmbeddingWait = true
            }
        } else {
            if (isDevelopmentMode() && user.email === "test123@collabryx.com") {
                const result = await completeTestUserOnboarding()
                if (result.success) {
                    destination = "/dashboard"
                    needsEmbeddingWait = true
                } else {
                    destination = "/onboarding"
                }
            } else {
                const skipParam = skipEmailVerification ? "?skipEmail=1" : ""
                destination = `/onboarding${skipParam}`
            }
        }
    } catch (error) {
        console.error('Auth sync failed:', error)
        return redirect("/login?error=unknown")
    }

    return <AuthSyncClient destination={destination} needsEmbeddingWait={needsEmbeddingWait} />
}
