"use client"

import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 0.8,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

            // Expose globally for imperative scrolling
            ;(window as Window & { lenis?: Lenis }).lenis = lenis

        return () => {
            lenis.destroy()
            delete (window as Window & { lenis?: Lenis }).lenis
        }
    }, [])

    return <>{children}</>
}
