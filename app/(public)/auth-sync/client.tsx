"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AuthSyncClient({ destination }: { destination: string }) {
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push(destination)
        }, 5000)

        return () => clearTimeout(timer)
    }, [router, destination])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-pulse">
                    Setting things up
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    Preparing your workspace...
                </p>
            </div>
        </div>
    )
}
