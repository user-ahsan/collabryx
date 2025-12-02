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
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50",
                className
            )}
        >
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                    <Icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
