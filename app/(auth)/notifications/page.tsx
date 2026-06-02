import NextDynamic from "next/dynamic"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stay updated with your network activity",
}

export const dynamic = "force-dynamic"

const PageContent = NextDynamic(
  () => import("./notifications-content"),
  { loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
)

export default function PageWrapper() {
  return <PageContent />
}
