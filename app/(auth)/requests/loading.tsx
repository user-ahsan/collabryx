import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function RequestsLoading() {
    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
            <div className="mb-6 sm:mb-8 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="w-full">
                {/* Skeleton tabs bar instead of real Tabs components */}
                <div className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-muted rounded-lg p-[3px] h-9">
                    <Skeleton className="h-full w-full rounded-md" />
                    <Skeleton className="h-full w-full rounded-md" />
                </div>

                <div className="mt-0 space-y-3 sm:space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 w-full max-w-sm">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                            <Skeleton className="h-3 w-12" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                        <Skeleton className="h-16 w-full rounded-lg" />
                                        <div className="flex gap-2 pt-2">
                                            <Skeleton className="h-9 w-24" />
                                            <Skeleton className="h-9 w-24" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

