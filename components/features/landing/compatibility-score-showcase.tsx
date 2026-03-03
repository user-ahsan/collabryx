"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ShinyText } from "@/components/ui/shiny-text"
import { HeartHandshake } from "@/public/icons/HeartHandshake"
import { Handshake, Rocket, Calendar } from "lucide-react"
import { AnimatedMatchScore } from "@/components/ui/animated-match-score"
import { MatchProfileCard } from "./match-profile-card"

export function CompatibilityScoreShowcase() {
    return (
        <section className="relative py-28 sm:py-36 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 shadow-sm">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Intelligent Matching</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <ShinyText
                            text="What Makes a Perfect Match?"
                            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
                            speed={7}
                        />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-muted-foreground"
                    >
                        Collabryx analyzes skills & expertise, interests & domain preferences, goals & project intentions, and availability & commitment.
                        The result: high-quality collaborators with complementary strengths.
                    </motion.p>
                </div>

                {/* Profile Cards with Compatibility Score */}
                <div className="relative max-w-5xl mx-auto w-full">
                    {/* Background Connecting Lines */}
                    <div className="hidden lg:block absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            <motion.line
                                x1="36%" y1="50%" x2="42%" y2="50%"
                                stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="6 6"
                                strokeLinecap="round"
                                initial={{ opacity: 0, pathLength: 0 }}
                                whileInView={{ opacity: 0.4, pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.8 }}
                            />
                            <motion.line
                                x1="58%" y1="50%" x2="64%" y2="50%"
                                stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="6 6"
                                strokeLinecap="round"
                                initial={{ opacity: 0, pathLength: 0 }}
                                whileInView={{ opacity: 0.4, pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.8 }}
                            />
                        </svg>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 relative z-10 px-4 sm:px-0">
                        <MatchProfileCard person="sarah" />
                        <AnimatedMatchScore />
                        <MatchProfileCard person="alex" />
                    </div>
                </div>

                {/* Match Breakdown */}
                <MatchBreakdown />
            </div>
        </section>
    )
}

function MatchBreakdown() {
    const matchReasons = [
        { label: "Complementary Skills", icon: Handshake, description: "Tech + Business expertise" },
        { label: "Shared Interest in Startups", icon: Rocket, description: "Both want to build products" },
        { label: "Matching Availability", icon: Calendar, description: "Available to start ASAP" }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20 max-w-5xl mx-auto w-full px-4 sm:px-0"
        >
            <h3 className="text-xl font-bold text-center mb-10 text-foreground">The result: high-quality collaborators with complementary strengths</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matchReasons.map((reason, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                        className="liquid-glass liquid-glass-interactive relative p-6 text-center md:text-left flex flex-col md:block items-center"
                    >
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-4 transition-colors relative z-10">
                            <reason.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-bold text-foreground mb-1.5 text-lg relative z-10">{reason.label}</div>
                        <div className="text-sm text-muted-foreground max-w-[200px] md:max-w-none relative z-10">{reason.description}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
