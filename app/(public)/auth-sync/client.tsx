"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { GlassCard } from "@/components/shared/glass-card"

export function AuthSyncClient({ destination }: { destination: string }) {
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const progressFillRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsVisible(true)

        const ctx = gsap.context(() => {
            const tl = gsap.timeline()

            tl.fromTo(
                containerRef.current,
                { opacity: 0, scale: 0.95, filter: "blur(10px)" },
                { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
            )

            tl.fromTo(
                logoRef.current,
                { y: -30, opacity: 0, scale: 0.8 },
                { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.7)" },
                "-=0.4"
            )

            tl.fromTo(
                titleRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
                "-=0.3"
            )

            tl.fromTo(
                progressRef.current,
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 1, duration: 0.5, ease: "power2.out" },
                "-=0.2"
            )

            tl.fromTo(
                subtitleRef.current,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
                "-=0.1"
            )

            gsap.to(progressFillRef.current, {
                scaleX: 1,
                duration: 3.5,
                ease: "power1.inOut",
                delay: 0.5,
            })

            gsap.to(logoRef.current, {
                y: -8,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            })

            const shimmer = document.querySelector(".shimmer-effect") as HTMLElement
            if (shimmer) {
                gsap.to(shimmer, {
                    backgroundPosition: "200% center",
                    duration: 1.5,
                    repeat: -1,
                    ease: "linear",
                })
            }
        }, containerRef)

        const timer = setTimeout(() => {
            gsap.to(containerRef.current, {
                opacity: 0,
                scale: 0.95,
                filter: "blur(10px)",
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    router.push(destination)
                },
            })
        }, 4500)

        return () => {
            ctx.revert()
            clearTimeout(timer)
        }
    }, [router, destination])

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[20%] w-[60%] h-[60%] rounded-full bg-[oklch(0.488_0.243_264.376)]/20 blur-[150px]" />
                <div className="absolute top-[50%] -right-[20%] w-[50%] h-[50%] rounded-full bg-[oklch(0.488_0.243_264.376)]/15 blur-[120px]" />
                <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
            </div>

            <div
                ref={containerRef}
                className="relative z-10 flex items-center justify-center min-h-screen"
            >
                <GlassCard
                    innerClassName="p-8 md:p-12"
                    className="w-full max-w-md mx-4"
                >
                    <div className="flex flex-col items-center gap-8">
                        <div
                            ref={logoRef}
                            className="relative"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 relative">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[oklch(0.488_0.243_264.376)] to-blue-600 opacity-20 blur-xl" />
                                <div className="relative w-full h-full rounded-2xl bg-background/80 backdrop-blur-xl border border-[oklch(0.488_0.243_264.376)]/20 flex items-center justify-center overflow-hidden">
                                    <svg
                                        width="48"
                                        height="48"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-[oklch(0.488_0.243_264.376)]"
                                    >
                                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                        <path d="M14.5 16.5c-2.5 2-6.5 1-8-2-1.5-3 1-7 4-8" />
                                        <path d="M17 10c0 1.5-.5 3-1.5 4" />
                                    </svg>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.488_0.243_264.376)]/10 to-transparent" />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[oklch(0.488_0.243_264.376)] flex items-center justify-center shadow-lg">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h1
                                ref={titleRef}
                                className="text-2xl md:text-3xl font-bold tracking-tight"
                            >
                                Setting things up
                            </h1>
                            <p
                                ref={subtitleRef}
                                className="text-muted-foreground text-sm md:text-base"
                            >
                                Preparing your workspace...
                            </p>
                        </div>

                        <div
                            ref={progressRef}
                            className="w-full h-1.5 bg-muted rounded-full overflow-hidden"
                        >
                            <div
                                ref={progressFillRef}
                                className="h-full w-full bg-gradient-to-r from-[oklch(0.488_0.243_264.376)] via-blue-500 to-[oklch(0.488_0.243_264.376)] rounded-full origin-left scale-x-0"
                                style={{ backgroundSize: "200% 100%" }}
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                            <div className="w-2 h-2 rounded-full bg-[oklch(0.488_0.243_264.376)]/60 animate-pulse" />
                            <span>Almost there</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
