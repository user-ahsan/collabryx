import NextDynamic from "next/dynamic"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Embedding Queue Admin",
  description: "Monitor embedding generation queue and retry failed items",
}

export const dynamic = "force-dynamic"

const EmbeddingQueueAdminContent = NextDynamic(
  () => import("./embedding-queue-admin-content"),
  { loading: () => <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div> }
)

export default function EmbeddingQueueAdminPage() {
  return <EmbeddingQueueAdminContent />
}
