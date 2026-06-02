import { createClient } from "@/lib/supabase/server"
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
        // ===========================================
        const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true"
        if (!skipEmailVerification && !user.email_confirmed_at) {
            return redirect("/verify-email")
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
                destination = "/onboarding"
            }
        }
    } catch (error) {
        console.error('Auth sync failed:', error)
        return redirect("/login?error=unknown")
    }

    return <AuthSyncClient destination={destination} needsEmbeddingWait={needsEmbeddingWait} />
}
