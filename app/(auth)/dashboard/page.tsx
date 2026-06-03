/**
 * Dashboard Page — Two-Column Layout (Phase 4 Implementation)
 * 
 * WHY TWO COLUMNS:
 * The previous dashboard was a single-column feed that wasted the left sidebar
 * space on large screens. This layout introduces a ProfileCard sidebar that
 * sits adjacent to (not inside) the centered feed, giving users quick access
 * to their profile stats without navigating away.
 * 
 * LAYOUT STRATEGY:
 * The feed is centered using max-w-2xl + mx-auto. The ProfileCard is positioned
 * using absolute positioning to the left of this centered container via
 * `right-full mr-6`. This ensures the feed stays perfectly centered regardless
 * of screen size — the card expands its space outward rather than pushing the
 * feed sideways. On screens below lg:, the card is hidden (hidden lg:block).
 * 
 * WHY ABSOLUTE POSITIONING:
 * Using flexbox or grid for the sidebar would shift the feed off-center on
 * mid-sized screens (where the sidebar is visible but the total width can't
 * accommodate both). Absolute positioning lets the feed stay centered while
 * the card "steals" empty margin space from the sides.
 */
import nextDynamic from 'next/dynamic'
import type { Metadata } from "next"
import { ProfileCard } from "@/components/features/dashboard/profile-card"

const Feed = nextDynamic(
  () => import("@/components/features/dashboard/feed").then(mod => ({ default: mod.Feed })),
  {
    ssr: true
  }
)

export const revalidate = 60

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dashboard | Collabryx",
  description: "Your personalized collaboration dashboard. Discover posts, opportunities, and connect with your network.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPage() {
    return (
        <div className="w-full py-2 md:py-6 px-2 md:px-6">
            {/* Feed is the primary element — centered independently on the page */}
            <div className="relative mx-auto max-w-2xl w-full">
                {/* Profile Card — absolutely positioned to the LEFT of the centered feed.
                    Because it's out of the normal flow, it does NOT push the feed off-center.
                    The feed stays perfectly centered while the profile card sits to its left. */}
                <aside className="hidden lg:block absolute right-full mr-6 top-0 w-80 xl:w-96">
                    <div className="sticky top-24 space-y-6">
                        <ProfileCard />
                    </div>
                </aside>

                <Feed />
            </div>
        </div>
    )
}
