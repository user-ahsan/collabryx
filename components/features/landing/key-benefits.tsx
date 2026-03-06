import * as React from "react"
import { motion } from "motion/react"

const keyBenefits = [
    {
        title: "Accurate Semantic Matching",
        description: "Powered by modern embeddings that understand meaning, goals, and context—not just keywords.",
        highlight: "AI-Powered Intelligence"
    },
    {
        title: "Student & Founder Focused",
        description: "Designed specifically for students and early-stage founders building projects and startups.",
        highlight: "Built for Your Journey"
    },
    {
        title: "Built-in AI Assistant",
        description: "Get startup planning help, MVP checklists, and personalized guidance whenever you need it.",
        highlight: "24/7 Mentorship"
    },
    {
        title: "Real-Time Messaging",
        description: "Simple, clean, student-friendly chat for faster team formation and collaboration.",
        highlight: "Instant Communication"
    }
]

export function KeyBenefits() {
    return (
        <section id="benefits" data-section-name="Benefits" className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                            Why Students & Founders Choose Collabryx
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Unique advantages designed for your journey.
                        </p>
                    </motion.div>
                </div>

                <div className="max-w-3xl mx-auto space-y-20 relative">
                    {/* thin vertical line */}
                    <div className="absolute left-8 lg:left-12 top-12 bottom-12 w-px bg-zinc-800 hidden md:block" />

                    {keyBenefits.map((benefit, idx) => {
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-16 relative group"
                            >
                                {/* Number */}
                                <div className="text-[80px] md:text-[110px] font-light text-white/10 w-12 lg:w-24 shrink-0 leading-none select-none group-hover:text-white/20 transition-colors duration-500 z-10 bg-background py-4 self-start">
                                    0{idx + 1}
                                </div>

                                <div className="relative z-10 md:pt-4 flex-1">
                                    <h3 className="mb-4 text-3xl font-medium text-foreground">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-base leading-loose text-muted-foreground mb-6">
                                        {benefit.description}
                                    </p>
                                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                        {benefit.highlight}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
