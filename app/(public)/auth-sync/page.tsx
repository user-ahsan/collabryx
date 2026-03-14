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
        // Check profile first (works for all users including test user)
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single()

        // If onboarding already completed, go to dashboard
        if (profile?.onboarding_completed === true) {
            destination = "/dashboard"
        } else {
            // In development mode with test user, auto-complete onboarding
            if (isDevelopmentMode() && user.email === "test123@collabryx.com") {
                const result = await completeTestUserOnboarding()
                if (result.success) {
                    destination = "/dashboard"
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

    return <AuthSyncClient destination={destination} />
}
