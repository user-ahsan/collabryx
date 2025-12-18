"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface MatchCardSkeletonProps {
    count?: number
}

export function MatchCardSkeleton({ count = 8 }: MatchCardSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="h-full overflow-hidden border bg-card p-6">
                    <div className="flex flex-col items-center">
                        {/* Avatar skeleton */}
                        <Skeleton className="h-28 w-28 rounded-full mb-4" />

                        {/* Name & Role */}
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24 mb-4" />
                    </div>

                    {/* Match Score */}
                    <div className="mb-6 space-y-3 rounded-xl bg-muted p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full animate-pulse" />
                    </div>

                    {/* Skills */}
                    <div className="mb-6 flex flex-wrap justify-center gap-1.5">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-14" />
                        <Skeleton className="h-6 w-18" />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 mb-6">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </div>
                </Card>
            ))}
        </>
    )
}
