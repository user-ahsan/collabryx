"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface InfiniteScrollTriggerProps {
    onLoadMore: () => Promise<void> | void
    hasMore: boolean
    isLoading: boolean
}

export function InfiniteScrollTrigger({ onLoadMore, hasMore, isLoading }: InfiniteScrollTriggerProps) {
    const observerTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current)
            }
        }
    }, [onLoadMore, hasMore, isLoading])

    if (!hasMore) return null

    return (
        <div ref={observerTarget} className="h-20 flex items-center justify-center w-full">
            {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
    )
}
