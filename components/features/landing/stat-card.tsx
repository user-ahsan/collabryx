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
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 text-center transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
                isInView && "animate-in fade-in slide-in-from-bottom-8",
                className
            )}
        >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out dark:from-primary/10 dark:via-primary/20 dark:to-primary/10" />

            {/* Spotlight effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-700" />

            <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary/20 shadow-lg shadow-primary/5">
                    <Icon className="h-7 w-7" />
                </div>

                {/* Animated number */}
                <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/80 bg-clip-text text-transparent drop-shadow-sm">
                        {prefix}
                        <CountUp
                            to={value}
                            duration={3.5} // Slower duration
                            delay={0.2}
                            startWhen={isInView}
                            separator=","
                        />
                        {suffix}
                    </span>
                </div>

                {/* Label */}
                <h3 className="mb-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {label}
                </h3>

                {/* Description */}
                {description && (
                    <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}
