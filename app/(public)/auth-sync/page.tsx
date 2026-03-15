import { createClient } from "@/lib/supabase/server"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"
import { AuthSyncClient } from "./client"

export default async function AuthSyncPage() {
    let destination = "/dashboard"
    let needsEmbeddingWait = false
    let configError = false

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase configuration missing')
        configError = true
        destination = "/login"
    } else {
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                destination = "/login"
            } else {
                // Check profile first (works for all users including test user)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed, profile_completion")
                    .eq("id", user.id)
                    .single()

                // If onboarding already completed, go to dashboard
                if (profile?.onboarding_completed === true) {
                    destination = "/dashboard"
                    
                    // Check if embedding exists - if not, show wait message
                    const { data: embedding } = await supabase
                        .from("profile_embeddings")
                        .select("status")
                        .eq("user_id", user.id)
                        .single()
                    
                    // If no embedding or still processing, show wait message but allow dashboard access
                    if (!embedding || embedding.status === 'processing' || embedding.status === 'pending') {
                        needsEmbeddingWait = true
                    }
                } else {
                    // In development mode with test user, auto-complete onboarding
                    if (isDevelopmentMode() && user.email === "test123@collabryx.com") {
                        const result = await completeTestUserOnboarding()
                        if (result.success) {
                            destination = "/dashboard"
                            needsEmbeddingWait = true
                        } else {
                            console.error("Failed to auto-complete test user onboarding:", result.error)
                            destination = "/onboarding"
                        }
                    } else {
                        // New user needs to complete onboarding
                        destination = "/onboarding"
                    }
                }
            }
        } catch (error) {
            console.error('❌ Auth sync error:', error)
            configError = true
            destination = "/login"
        }
    }

    return <AuthSyncClient destination={destination} needsEmbeddingWait={needsEmbeddingWait} configError={configError} />
}
