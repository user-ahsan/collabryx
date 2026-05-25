import { PostSkeleton } from "@/components/shared/skeletons"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background md:bg-muted/10 md:py-8">
      <PostSkeleton />
    </div>
  )
}
