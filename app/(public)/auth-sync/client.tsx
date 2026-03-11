"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"

export function AuthSyncClient({ destination }: { destination: string }) {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline()

            tl.fromTo(
                containerRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.8, ease: "power2.out" }
            )

            tl.fromTo(
                titleRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
                "-=0.4"
            )

            tl.fromTo(
                subtitleRef.current,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
                "-=0.3"
            )

            tl.fromTo(
                lineRef.current,
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 1, duration: 1.2, ease: "power2.inOut" },
                "-=0.2"
            )
        }, containerRef)

        const timer = setTimeout(() => {
            gsap.to(containerRef.current, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    router.push(destination)
                },
            })
        }, 5000)

        return () => {
            ctx.revert()
            clearTimeout(timer)
        }
    }, [router, destination])

    return (
        <div className="min-h-screen bg-background dark:bg-[#0A0A0F] flex items-center justify-center">
            <div
                ref={containerRef}
                className="flex flex-col items-center gap-6"
            >
                <h1
                    ref={titleRef}
                    className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground"
                    style={{ fontFamily: "var(--font-heading, system-ui)" }}
                >
                    Setting things up
                </h1>
                <p
                    ref={subtitleRef}
                    className="text-muted-foreground text-lg font-medium tracking-wide"
                >
                    Preparing your workspace
                </p>
                <div 
                    ref={lineRef}
                    className="w-24 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"
                />
            </div>
        </div>
    )
}
