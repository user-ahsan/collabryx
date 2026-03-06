import { Skeleton } from "@/components/ui/skeleton"
import { PostCard } from "./post-card"

export function PostSkeleton() {
    return (
        <PostCard>
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[60%]" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl mt-4" />
            <div className="flex justify-between pt-4">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
        </PostCard>
    )
}

