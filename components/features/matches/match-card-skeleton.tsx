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
                <Card key={i} className="h-full overflow-hidden border bg-card">
                    {/* Banner skeleton */}
                    <Skeleton className="h-[100px] w-full rounded-t-xl rounded-b-none" />

                    {/* Avatar - centered, overlapping */}
                    <div className="flex justify-center -mt-10 mb-1">
                        <Skeleton className="h-20 w-20 rounded-full ring-4 ring-background" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col px-4 pb-4 gap-2.5">
                        {/* Name + Role */}
                        <div className="flex flex-col items-center gap-1">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-24" />
                        </div>

                        {/* Location + Status */}
                        <div className="flex justify-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>

                        {/* Match Score card */}
                        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-5 w-10" />
                            </div>
                            <Skeleton className="h-1.5 w-full" />
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5">
                            <Skeleton className="h-5 w-14 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                    </div>
                </Card>
            ))}
        </>
    )
}

export function MatchCardListViewSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 w-full space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Skeleton className="h-8 w-24 flex-1 sm:flex-none" />
                            <Skeleton className="h-8 w-24 flex-1 sm:flex-none" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
