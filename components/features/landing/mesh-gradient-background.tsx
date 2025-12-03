"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

export const MeshGradientBackground = ({ className }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e
            const { innerWidth, innerHeight } = window

            const x = (clientX / innerWidth) * 100
            const y = (clientY / innerHeight) * 100

            container.style.setProperty("--mouse-x", `${x}%`)
            container.style.setProperty("--mouse-y", `${y}%`)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn("fixed inset-0 -z-10 overflow-hidden bg-background", className)}
            style={{
                "--mouse-x": "50%",
                "--mouse-y": "50%",
            } as React.CSSProperties}
        >
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

            {/* Moving Orbs */}
            <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px] animate-float-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] animate-float-delayed" />

            {/* Mouse Follower */}
            <div
                className="absolute h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] transition-transform duration-1000 ease-out will-change-transform"
                style={{
                    left: "var(--mouse-x)",
                    top: "var(--mouse-y)",
                }}
            />

            {/* Grid Overlay for texture */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30 dark:opacity-100" />

            {/* Noise Overlay for texture */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    )
}
