import NextDynamic from "next/dynamic"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Collabryx — AI-Powered Collaboration Platform",
  description: "Find co-founders, teammates, and opportunities using semantic matching powered by vector embeddings.",
}

export const dynamic = "force-dynamic"

const PageContent = NextDynamic(
  () => import("./landing-content"),
  { loading: () => <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
)

export default function PageWrapper() {
  return <PageContent />
}
