"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { BadgeCheck } from "@/public/icons/BadgeCheck"
import { Bolt } from "@/public/icons/Bolt"

export function SemanticEngineComparison() {
    const isMobile = useIsMobile()
    const prefersReducedMotion = usePrefersReducedMotion()
    const enableComplexAnimation = !isMobile && !prefersReducedMotion

    return (
        <section className="relative py-28 md:py-36 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left: Text + Bullet Explanation */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bolt className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-foreground">
                                Traditional vs Semantic Search
                            </h2>
                        </div>

                        <p className="text-lg text-muted-foreground mb-8">
                            Traditional networks match you based on raw keywords, leading to thousands of generic, misaligned results.
                            Collabryx changes this. Our AI reads between the lines to find exactly who you need.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-foreground font-semibold text-lg">Meaning over Keywords</h4>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Matches based on meaning, goals, and context, parsing full bios instead of standard title tags.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-foreground font-semibold text-lg">Complementary Synergy</h4>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Understands how your skills complement others. If you&apos;re technical, it finds you a matching business counterpart.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-foreground font-semibold text-lg">High-Fidelity Suggestions</h4>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Suggests collaborators who truly align with your project vision and current startup stage.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Floating Glass Demo UI */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Background subtle glow */}
                        <div
                            className="absolute -inset-20 pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, transparent 60%)'
                            }}
                        />

                        <div className="rotate-1 hover:rotate-0 transition-transform duration-500 will-change-transform">
                            <div className="liquid-glass p-6 md:p-8 animate-float">
                                {/* Search query mock */}
                                <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Intent Analysis</div>
                                    <p className="text-sm text-foreground">
                                        &quot;I&apos;m a CS junior who loves <span className="text-primary font-medium bg-primary/10 px-1 rounded">fintech</span> and needs a <span className="text-primary font-medium bg-primary/10 px-1 rounded">business partner</span>.&quot;
                                    </p>
                                </div>

                                <SemanticMatchCard enableAnimation={enableComplexAnimation} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

function SemanticMatchCard({ enableAnimation }: { enableAnimation: boolean }) {
    const [isInView, setIsInView] = React.useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            className="relative p-5 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-md overflow-hidden group"
        >
            {enableAnimation && isInView && <VectorLines />}

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                        AF
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground text-lg">Alex Foster</div>
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide mt-0.5">Finance Major • MBA</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold font-mono border border-green-500/30">
                        94% MATCH
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5 border-l-2 border-primary/40 pl-3 italic">
                    &quot;Looking for a tech partner to build an MVP for a fintech concept.
                    I handle business strategy and early-stage funding.&quot;
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-foreground/80">Complementary</span>
                    <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-foreground/80">Fintech</span>
                    <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-foreground/80">Pre-seed</span>
                </div>
            </div>
        </motion.div>
    )
}

function VectorLines() {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-50 mix-blend-screen"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[1, 2, 3].map((i) => (
                <motion.line
                    key={i}
                    x1="10%"
                    y1={`${20 + i * 20}%`}
                    x2="90%"
                    y2={`${30 + i * 15}%`}
                    stroke="url(#lineGrad)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
                />
            ))}
            {[1, 2, 3, 4].map((i) => (
                <motion.circle
                    key={`node-${i}`}
                    cx={`${20 + i * 20}%`}
                    cy={`${25 + (i % 2) * 30}%`}
                    r="4"
                    fill="hsl(var(--primary))"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                />
            ))}
            <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                </linearGradient>
            </defs>
        </svg>
    )
}
