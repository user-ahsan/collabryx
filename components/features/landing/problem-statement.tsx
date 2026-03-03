"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Users, Unlink, Compass } from "lucide-react"

export function ProblemStatement() {
    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-6xl font-semibold tracking-tighter text-foreground mb-6"
                    >
                        The Problem
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[15px] text-muted-foreground leading-relaxed"
                    >
                        Students and early founders struggle to discover collaborators with{" "}
                        <span className="text-foreground font-semibold">complementary skills</span>. Traditional social and professional networks rely on{" "}
                        <span className="text-foreground font-semibold">keywords and manual browsing</span>, making it difficult to understand deeper intent, goals, or startup interests.
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
                            transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                            className="liquid-glass liquid-glass-interactive relative p-8 flex flex-col items-start"
                        >
                            <div className="mb-6 text-white">
                                {point.icon}
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mb-3">
                                {point.title}
                            </h3>
                            <p className="text-[15px] text-muted-foreground leading-relaxed">
                                {point.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-zinc-800 my-16" />

                {/* Solution Intro */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="liquid-glass relative mx-auto max-w-5xl p-10 md:p-14 text-center"
                >
                    <h3 className="text-4xl font-semibold tracking-tighter text-foreground mb-6">
                        The Collabryx Solution
                    </h3>

                    <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Collabryx converts user profiles into{" "}
                        <span className="text-primary font-semibold">vector embeddings</span> and uses{" "}
                        <span className="text-primary font-semibold">semantic similarity</span> to recommend collaborators who align with your interests, skills, and goals.
                        The platform also includes an AI assistant for startup planning and a secure chat to help matched users communicate effectively.
                    </p>

                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-primary/20 blur-xl" />
                    <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-primary/20 blur-xl" />
                </motion.div>
            </div>
        </section>
    )
}

const painPoints = [
    {
        icon: <Unlink size={48} strokeWidth={1.5} />,
        title: "Poor Discovery",
        description: "Keyword search isn't enough for finding meaningful matches. Traditional search misses deeper intent and alignment."
    },
    {
        icon: <Users size={48} strokeWidth={1.5} />,
        title: "Weak Collaboration",
        description: "Mismatched teams lead to abandoned projects. Without proper discovery, collaboration falls apart."
    },
    {
        icon: <Compass size={48} strokeWidth={1.5} />,
        title: "No Structured Guidance",
        description: "Founders lack early-stage planning support. Students need mentorship tailored to their startup journey."
    }
]
