"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ShinyText } from "@/components/ui/shiny-text"
import { Network } from "@/public/icons/Network"
import { Users } from "@/public/icons/Users"
import { BadgeCheck } from "@/public/icons/BadgeCheck"

export function ProblemStatement() {
    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium"
                    >
                        <span>❌</span>
                        <span>The Problem</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <ShinyText
                            text="Students Struggle to Find the Right Collaborators"
                            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
                            speed={8}
                        />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-muted-foreground leading-relaxed"
                    >
                        Many students and fresh graduates struggle to meet peers with{" "}
                        <span className="text-foreground font-semibold">complementary skills</span> needed to start small teams or early-stage startups.
                        Existing social and professional networks have{" "}
                        <span className="text-foreground font-semibold">limited tools</span> for students to discover collaborators based on deep interests.
                    </motion.p>
                </div>

                {/* Pain Points Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {painPoints.map((point, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 + idx * 0.12 }}
                            className="relative p-6 rounded-xl border border-border bg-background/60 backdrop-blur-sm"
                        >
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                {point.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {point.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {point.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Solution Intro */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="relative mx-auto max-w-3xl p-8 rounded-2xl border-2 border-primary/30 bg-primary/5 backdrop-blur-sm"
                >
                    <div className="text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
                                <BadgeCheck className="h-4 w-4" />
                                <span>The Collabryx Solution</span>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-foreground mb-4">
                            AI-Powered Semantic Matching
                        </h3>

                        <p className="text-muted-foreground leading-relaxed">
                            Collabryx uses{" "}
                            <span className="text-primary font-semibold">vector embeddings</span> and{" "}
                            <span className="text-primary font-semibold">semantic search</span> to understand your profile,
                            interests, skills, and goals—then automatically suggests high-quality collaborators who complement your ambitions.
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-primary/30 blur-lg" />
                    <div className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full bg-primary/30 blur-lg" />
                </motion.div>
            </div>
        </section>
    )
}

const painPoints = [
    {
        icon: <Network className="h-6 w-6" />,
        title: "Poor Discovery",
        description: "Keyword searches return thousands of generic results. Finding someone who truly matches your vision is like finding a needle in a haystack."
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: "Weak Collaboration",
        description: "Students waste time on mismatched teams. Without proper vetting, projects fail due to skill gaps or misaligned goals."
    },
    {
        icon: "🤔",
        title: "No Guidance",
        description: "Early-stage founders lack access to mentorship and structured startup planning tools tailored to students."
    }
]
