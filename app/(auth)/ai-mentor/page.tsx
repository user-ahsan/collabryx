import NextDynamic from "next/dynamic"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Mentor",
  description: "Get AI-powered mentorship and guidance",
}

export const dynamic = "force-dynamic"

const AIMentorContent = NextDynamic(
  () => import("./ai-mentor-content"),
  { loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
)

interface AIMentorPageProps {
  searchParams: Promise<{ collaborate?: string; context?: string }>
}

export default async function AIMentorPage({ searchParams }: AIMentorPageProps) {
  const params = await searchParams
  return (
    <AIMentorContent
      collaborateUserId={params.collaborate || undefined}
      startupContextParam={params.context || undefined}
    />
  )
}
