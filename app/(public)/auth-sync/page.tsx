import { createClient } from "@/lib/supabase/server"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"
import { AuthSyncClient } from "./client"
import { redirect } from 'next/navigation'

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
        
        // Check profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, profile_completion")
            .eq("id", user.id)
            .single()

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
        return redirect("/login?error=unknown")
    }

    return <AuthSyncClient destination={destination} needsEmbeddingWait={needsEmbeddingWait} />
}
