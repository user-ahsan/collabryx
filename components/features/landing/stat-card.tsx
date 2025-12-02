"use client"

import * as React from "react"
import { useInView } from "motion/react"
import CountUp from "@/components/CountUp"
import { cn } from "@/lib/utils"

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>
    value: number
    label: string
    suffix?: string
    prefix?: string
    description?: string
    className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    value,
    label,
    suffix = "",
    prefix = "",
    description,
    className,
}) => {
    const ref = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <div
            ref={ref}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center transition-all duration-500",
                isInView && "animate-in fade-in slide-in-from-bottom-8",
                className
            )}
        >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="h-7 w-7" />
                </div>

                {/* Animated number */}
                <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                        {prefix}
                        <CountUp
                            to={value}
                            duration={2.5}
                            delay={0.2}
                            startWhen={isInView}
                            separator=","
                        />
                        {suffix}
                    </span>
                </div>

                {/* Label */}
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                    {label}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}
