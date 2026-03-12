import { MatchesClient } from "@/components/features/matches/matches-client"
import type { Metadata } from "next"

export const revalidate = 60

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Matches | Collabryx",
  description: "Discover your perfect collaborators. AI-powered semantic matching connects you with complementary skills and shared goals.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function MatchesPage() {
    return <MatchesClient />
}
