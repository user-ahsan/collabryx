import NextDynamic from "next/dynamic"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "AI-powered assistant for collaboration and project management",
}

export const dynamic = "force-dynamic"

const AssistantContent = NextDynamic(
  () => import("./assistant-content"),
  { loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
)

export default function AssistantPage() {
  return <AssistantContent />
}
