import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function NotificationsLoading() {
    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
            <div className="mb-8 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="space-y-4">
                <div className="flex gap-2 mb-6">
                    <Skeleton className="h-9 w-24 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 border rounded-xl bg-card">
                            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-4 w-3/4 max-w-[400px]" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
