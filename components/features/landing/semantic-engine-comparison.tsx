"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { Network } from "@/public/icons/Network"
import { Bolt } from "@/public/icons/Bolt"
import { BadgeCheck } from "@/public/icons/BadgeCheck"

export function SemanticEngineComparison() {
    const isMobile = useIsMobile()
    const prefersReducedMotion = usePrefersReducedMotion()

    // Disable complex animations on mobile or if user prefers reduced motion
    const enableComplexAnimation = !isMobile && !prefersReducedMotion

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
                    >
                        Connect on Context, Not Just Keywords
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Our AI understands your goals, not just your tags. We match intent with capability using semantic intelligence.
                    </motion.p>
                </div>

                {/* Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Traditional Search (The Problem) */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Network className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold text-muted-foreground">Traditional Search</h3>
                        </div>

                        {/* Search Input Mockup */}
                        <div className="mb-6 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="text-foreground font-medium">Search:</span>
                                <span>"React Developer"</span>
                            </div>
                        </div>

                        {/* Generic Results */}
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground mb-4">1,000+ results found</div>
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={enableComplexAnimation ? { opacity: 0, y: 10 } : { opacity: 1 }}
                                    whileInView={enableComplexAnimation ? { opacity: 1, y: 0 } : { opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: i * 0.1 }}
                                    className="p-4 rounded-lg border border-border/50 bg-muted/30"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-muted" />
                                        <div className="flex-1">
                                            <div className="h-3 w-32 bg-muted rounded mb-2" />
                                            <div className="h-2 w-24 bg-muted/60 rounded" />
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground opacity-60">
                                        Skills: React, JavaScript...
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Problem Badge */}
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
                            <span>❌</span>
                            <span>Too generic, no context</span>
                        </div>
                    </motion.div>

                    {/* Right: Collabryx Semantic Search (The Solution) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bolt className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary">Collabryx Semantic Search</h3>
                        </div>

                        {/* User Bio Input */}
                        <div className="mb-8 p-5 rounded-lg border border-primary/30 bg-primary/5 backdrop-blur-sm">
                            <div className="text-sm mb-2 text-muted-foreground">Your Profile:</div>
                            <p className="text-sm leading-relaxed text-foreground">
                                "I'm a CS junior who loves <span className="font-semibold text-primary">fintech</span> and wants to build an <span className="font-semibold text-primary">app for stock tracking</span>."
                            </p>
                        </div>

                        {/* Semantic Match Result with Animation */}
                        <SemanticMatchCard enableAnimation={enableComplexAnimation} />

                        {/* Success Badge */}
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <BadgeCheck className="h-4 w-4" />
                            <span>Perfect context match</span>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Caption */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 text-center"
                >
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Our AI uses <span className="text-primary font-semibold">vector embeddings</span> to understand the semantic meaning of your profile,
                        matching you with collaborators who complement your goals—not just keyword matches.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

/**
 * Semantic Match Card with optional vector constellation animation
 */
function SemanticMatchCard({ enableAnimation }: { enableAnimation: boolean }) {
    const [isInView, setIsInView] = React.useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative p-6 rounded-xl border-2 border-primary/50 bg-card/60 backdrop-blur-sm shadow-lg shadow-primary/10"
        >
            {/* Vector Connection Lines (Desktop Only) */}
            {enableAnimation && isInView && <VectorLines />}

            {/* Match Profile */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        AF
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground">Alex Foster</div>
                        <div className="text-xs text-muted-foreground">Finance Major • Founder</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        94% Match
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    "Looking for a <span className="text-primary font-medium">tech partner</span> to build an MVP for a <span className="text-primary font-medium">fintech startup</span>.
                    I handle business strategy and funding."
                </p>

                {/* Match Reasons */}
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Complementary Skills</span>
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Shared Interest: Fintech</span>
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Similar Goals</span>
                </div>
            </div>
        </motion.div>
    )
}

/**
 * Vector constellation animation (Desktop only)
 * Lightweight SVG overlay showing connecting nodes
 */
function VectorLines() {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Animated connecting lines */}
            {[1, 2, 3].map((i) => (
                <motion.line
                    key={i}
                    x1="10%"
                    y1={`${20 + i * 20}%`}
                    x2="90%"
                    y2={`${30 + i * 15}%`}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
                />
            ))}

            {/* Animated nodes */}
            {[1, 2, 3, 4].map((i) => (
                <motion.circle
                    key={`node-${i}`}
                    cx={`${20 + i * 20}%`}
                    cy={`${25 + (i % 2) * 30}%`}
                    r="3"
                    fill="hsl(var(--primary))"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                />
            ))}
        </svg>
    )
}
