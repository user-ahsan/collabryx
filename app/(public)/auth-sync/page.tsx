import { createClient } from "@/lib/supabase/server"
import { AuthSyncClient } from "./client"

export default async function AuthSyncPage() {
    const supabase = await createClient()
    let destination = "/dashboard"

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        destination = "/login"
    } else {
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single()

        if (!profile || profile.onboarding_completed === false) {
            destination = "/onboarding"
        }
    }

    return <AuthSyncClient destination={destination} />
}
