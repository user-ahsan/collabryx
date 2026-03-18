import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { ModerationDashboardClient } from "./moderation-dashboard-client"

export const metadata: Metadata = {
  title: "Content Moderation | Admin",
  description: "Manage and review reported content",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ModerationDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review reported content and manage community guidelines
        </p>
      </div>
      <ModerationDashboardClient />
    </div>
  )
}
