"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    className?: string
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon: Icon,
    title,
    description,
    className,
}) => {
    const divRef = React.useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = React.useState(false)
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = React.useState(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || isFocused) return

        const div = divRef.current
        const rect = div.getBoundingClientRect()

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleFocus = () => {
        setIsFocused(true)
        setOpacity(1)
    }

    const handleBlur = () => {
        setIsFocused(false)
        setOpacity(0)
    }

    const handleMouseEnter = () => {
        setOpacity(1)
    }

    const handleMouseLeave = () => {
        setOpacity(0)
    }

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                className
            )}
        >
            {/* Spotlight effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59,130,246,0.15), transparent 40%)`,
                }}
            />

            {/* Border Spotlight */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59,130,246,0.5), transparent 40%)`,
                    maskImage: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                    padding: "1px",
                }}
            />

            <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 shadow-sm">
                    <Icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80">
                    {description}
                </p>
            </div>
        </div>
    )
}
