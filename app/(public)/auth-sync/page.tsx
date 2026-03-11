import { createClient } from "@/lib/supabase/server"
import { completeTestUserOnboarding, isDevelopmentMode } from "@/lib/services/development"
import { AuthSyncClient } from "./client"

export default async function AuthSyncPage() {
    const supabase = await createClient()
    let destination = "/dashboard"

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        destination = "/login"
    } else {
        // In development mode, check if this is the test user and auto-complete onboarding
        if (isDevelopmentMode() && user.email === "test123@collabryx.com") {
            // Auto-complete onboarding for test user
            const result = await completeTestUserOnboarding()
            if (result.success) {
                destination = "/dashboard"
            } else {
                console.error("Failed to auto-complete test user onboarding:", result.error)
                destination = "/onboarding"
            }
        } else {
            // Check regular user profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", user.id)
                .single()

            // Redirect to onboarding if:
            // 1. Profile doesn't exist (new user), OR
            // 2. Profile exists but onboarding is not completed
            if (!profile || profile.onboarding_completed !== true) {
                destination = "/onboarding"
            }
        }
    }

    return <AuthSyncClient destination={destination} />
}
