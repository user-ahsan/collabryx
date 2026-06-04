"use client"

/**
 * PullToRefresh — Pull-down gesture to refresh wrapper
 *
 * Works with both touch (mobile) and mouse (desktop) drag gestures.
 * Uses framer-motion for spring-animated pull indicator and content offset.
 * Only activates when the user is scrolled to the top of the page.
 *
 * WHY THIS EXISTS:
 * The dashboard feed had no way to manually refresh posts. Users naturally
 * try pulling down to refresh — this component adds that missing gesture.
 *
 * WHY FRAMER-MOTION (not CSS):
 * - Spring-based snap animations feel more natural than CSS transitions
 * - Motion values avoid React re-renders during drag (60fps on UI thread)
 * - useTransform gives us the arrow rotation mapping for free
 */
import { useState, useRef, useCallback } from "react"
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
    const currentPointerId = useRef<number | null>(null)

    const getClientY = (e: React.TouchEvent | React.MouseEvent | MouseEvent | TouchEvent): number => {
        if ('touches' in e && e.touches.length > 0) return e.touches[0].clientY
        if ('clientY' in e) return e.clientY
        return 0
    }

    const beginPull = useCallback(
        (clientY: number) => {
            if (refreshing) return
            // Only activate if the page is scrolled to the very top
            if (window.scrollY > 0) return

            startY.current = clientY
            isPulling.current = true
        },
        [refreshing]
    )

    const movePull = useCallback(
        (clientY: number) => {
            if (!isPulling.current || refreshing) return

            const diff = clientY - startY.current

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

    const endPull = useCallback(async () => {
        if (!isPulling.current || refreshing) return
        isPulling.current = false
        currentPointerId.current = null

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

    // ── Touch handlers ──
    const onTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (currentPointerId.current !== null) return // already tracking a pointer
            currentPointerId.current = e.changedTouches[0].identifier
            beginPull(e.touches[0].clientY)
        },
        [beginPull]
    )

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            movePull(e.touches[0].clientY)
        },
        [movePull]
    )

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (currentPointerId.current === null) return
            currentPointerId.current = null
            endPull()
        },
        [endPull]
    )

    // ── Mouse handlers ──
    const [isDragging, setIsDragging] = useState(false)

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return // left click only
            // Only activate at the very top of the page
            if (window.scrollY > 0) return
            if (currentPointerId.current !== null) return

            currentPointerId.current = 1
            setIsDragging(true)
            startY.current = e.clientY
            isPulling.current = true
        },
        []
    )

    const onMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isPulling.current || refreshing) return
            movePull(e.clientY)
        },
        [movePull, refreshing]
    )

    const onMouseUp = useCallback(() => {
        if (!isPulling.current) return
        setIsDragging(false)
        currentPointerId.current = null
        endPull()
    }, [endPull])

    // ── Global mouse-up/move to catch releases outside the element ──
    // We attach these via refs to avoid stale closures in global listeners
    const endPullRef = useRef(endPull)
    endPullRef.current = endPull
    const isPullingRef = useRef(isPulling)
    isPullingRef.current = isPulling

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative select-none",
                isDragging && "cursor-grabbing",
                className
            )}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
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
