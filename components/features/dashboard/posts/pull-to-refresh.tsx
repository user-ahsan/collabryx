"use client"

/**
 * PullToRefresh — Touch-gesture pull-to-refresh wrapper
 *
 * Uses framer-motion for spring-animated pull indicator and content offset.
 * Only activates when the user is scrolled to the top of the container.
 * On non-touch devices this is a no-op — children render without wrapping.
 *
 * WHY THIS EXISTS:
 * The dashboard feed had no way to manually refresh posts. Users on mobile
 * naturally try pulling down to refresh, but the gesture was unhandled.
 * This component adds that missing interaction pattern.
 *
 * WHY FRAMER-MOTION (not CSS):
 * - Spring-based snap animations feel more natural than CSS transitions
 * - Motion values avoid React re-renders during drag (60fps on UI thread)
 * - useTransform gives us the arrow rotation mapping for free
 */
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
    /** Called when the user completes a pull-to-refresh gesture */
    onRefresh: () => Promise<void>
    children: React.ReactNode
    /** Pull distance in px required to trigger a refresh. Default 80. */
    threshold?: number
    className?: string
}

export function PullToRefresh({
    onRefresh,
    children,
    threshold = 80,
    className,
}: PullToRefreshProps) {
    const [refreshing, setRefreshing] = useState(false)
    const [isTouchDevice, setIsTouchDevice] = useState(false)

    // Motion values drive the animation at 60fps without React re-renders
    const pullDistance = useMotionValue(0)

    // Arrow rotation: 0° at rest → 180° at threshold
    const arrowRotation = useTransform(pullDistance, [0, threshold], [0, 180])

    // Indicator opacity: fades in as you pull
    const indicatorOpacity = useTransform(pullDistance, [0, threshold * 0.3], [0, 1])

    // Content Y offset matches the pull distance (clamped at threshold while refreshing)
    const contentY = useTransform(pullDistance, (d) => (refreshing ? threshold : d))

    const containerRef = useRef<HTMLDivElement>(null)
    const startY = useRef(0)
    const isPulling = useRef(false)
    const isAtTop = useRef(true)

    // Detect touch capability on mount
    useEffect(() => {
        setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }, [])

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (refreshing) return
            // Only activate if the page is scrolled to the very top
            isAtTop.current = window.scrollY <= 0
            if (!isAtTop.current) return

            startY.current = e.touches[0].clientY
            isPulling.current = true
        },
        [refreshing]
    )

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isPulling.current || refreshing || !isAtTop.current) return

            const currentY = e.touches[0].clientY
            const diff = currentY - startY.current

            if (diff <= 0) {
                pullDistance.set(0)
                return
            }

            // Apply resistance curve so it doesn't feel too loose:
            // Small pulls feel natural, large pulls require more force
            const resisted = Math.sqrt(diff * 4) * 2
            pullDistance.set(Math.min(resisted, threshold * 1.3))
        },
        [pullDistance, threshold, refreshing]
    )

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || refreshing) return
        isPulling.current = false

        const distance = pullDistance.get()

        if (distance >= threshold) {
            // Trigger refresh
            setRefreshing(true)
            animate(pullDistance, threshold, {
                type: "spring",
                stiffness: 200,
                damping: 25,
            })

            try {
                await onRefresh()
            } finally {
                setRefreshing(false)
                animate(pullDistance, 0, {
                    type: "spring",
                    stiffness: 250,
                    damping: 28,
                    mass: 0.8,
                })
            }
        } else {
            // Snap back without refreshing
            animate(pullDistance, 0, {
                type: "spring",
                stiffness: 250,
                damping: 28,
                mass: 0.8,
            })
        }
    }, [pullDistance, threshold, refreshing, onRefresh])

    // If not a touch device, render children as-is (no gesture handling)
    if (!isTouchDevice) {
        return <div className={className}>{children}</div>
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative touch-pan-y", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator — positioned above the content */}
            <motion.div
                className="absolute left-0 right-0 flex items-center justify-center z-10 h-12 -top-12"
                style={{ opacity: indicatorOpacity }}
            >
                {refreshing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                    <motion.div style={{ rotate: arrowRotation }}>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                )}
            </motion.div>

            {/* Content — moves down as the user pulls */}
            <motion.div style={{ y: contentY }}>
                {children}
            </motion.div>
        </div>
    )
}
