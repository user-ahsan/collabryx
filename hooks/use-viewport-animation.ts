import { useEffect, useState, RefObject } from "react"

interface UseViewportAnimationOptions {
    threshold?: number
    rootMargin?: string
    once?: boolean
}

export const useViewportAnimation = (
    ref: RefObject<Element>,
    options: UseViewportAnimationOptions = {}
): boolean => {
    const { threshold = 0.1, rootMargin = "0px", once = true } = options
    const [isInView, setIsInView] = useState(false)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    if (once) {
                        observer.unobserve(element)
                    }
                } else if (!once) {
                    setIsInView(false)
                }
            },
            { threshold, rootMargin }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [ref, threshold, rootMargin, once])

    return isInView
}
