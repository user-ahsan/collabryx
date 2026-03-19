import { ActivityFeed } from "@/components/features/activity/activity-feed"
import { GlassCard } from "@/components/shared/glass-card"
import type { Metadata } from "next"

export const revalidate = 60

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Activity | Collabryx",
  description: "View your recent activity and interactions",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ActivityPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with your profile views, matches, and interactions
        </p>
      </div>

      <GlassCard>
        <div className="p-4 md:p-5">
          <ActivityFeed 
            initialLimit={20} 
            showViewAll={true}
          />
        </div>
      </GlassCard>
    </div>
  )
}
