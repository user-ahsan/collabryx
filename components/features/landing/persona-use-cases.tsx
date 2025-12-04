"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "@/public/icons/Users"
import { ChartLine } from "@/public/icons/ChartLine"
import { BadgeCheck } from "@/public/icons/BadgeCheck"

const personas = [
    {
        id: "students",
        label: "Students",
        icon: Users,
        title: "Find Your Project Team",
        description: "Connect with peers for your Final Year Project, hackathon teammates, or study groups.",
        benefits: [
            "Find teammates with complementary skills",
            "Match for hackathons and competitions",
            "Build your network early"
        ],
        bgColor: "from-blue-500/10 to-cyan-500/10",
        accentColor: "text-blue-500"
    },
    {
        id: "founders",
        label: "Founders",
        icon: ChartLine,
        title: "Find Your Co-Founder",
        description: "Discover your technical co-founder, early marketing hire, or founding team members.",
        benefits: [
            "Match with complementary expertise",
            "AI-powered compatibility scoring",
            "Vet partners before committing"
        ],
        bgColor: "from-purple-500/10 to-pink-500/10",
        accentColor: "text-purple-500"
    },
    {
        id: "mentors",
        label: "Mentors",
        icon: BadgeCheck,
        title: "Share Your Expertise",
        description: "Guide the next generation of innovators and give back to the community.",
        benefits: [
            "Connect with ambitious students",
            "Share your startup journey",
            "Build meaningful relationships"
        ],
        bgColor: "from-green-500/10 to-emerald-500/10",
        accentColor: "text-green-500"
    }
]

export function PersonaUseCases() {
    const [activeTab, setActiveTab] = React.useState("students")
    const isMobile = useIsMobile()
    const prefersReducedMotion = usePrefersReducedMotion()

    // Use simple fade on mobile, complex transitions on desktop
    const useComplexTransitions = !isMobile && !prefersReducedMotion

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
                    >
                        Built for Every Stage of Your Journey
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Whether you're a student, founder, or mentor—Collabryx helps you find the right collaborators.
                    </motion.p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
                    {/* Tab List */}
                    <TabsList className="grid w-full grid-cols-3 mb-12 h-auto p-1">
                        {personas.map((persona) => {
                            const Icon = persona.icon
                            return (
                                <TabsTrigger
                                    key={persona.id}
                                    value={persona.id}
                                    className="flex flex-col sm:flex-row items-center gap-2 py-3 data-[state=active]:bg-primary/10"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{persona.label}</span>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {personas.map((persona) => {
                            const Icon = persona.icon
                            return (
                                <TabsContent key={persona.id} value={persona.id} className="mt-0">
                                    {useComplexTransitions ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <PersonaContent persona={persona} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <PersonaContent persona={persona} />
                                        </motion.div>
                                    )}
                                </TabsContent>
                            )
                        })}
                    </AnimatePresence>
                </Tabs>
            </div>

            {/* Background Gradient (changes per persona) */}
            <AnimatePresence mode="wait">
                {personas.map((persona) => (
                    activeTab === persona.id && (
                        <motion.div
                            key={persona.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className={`absolute inset-0 -z-10 bg-gradient-to-br ${persona.bgColor} blur-3xl`}
                        />
                    )
                ))}
            </AnimatePresence>
        </section>
    )
}

/**
 * Persona Content Component
 */
function PersonaContent({ persona }: { persona: typeof personas[0] }) {
    const Icon = persona.icon

    return (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8 sm:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Content */}
                <div>
                    <div className={`inline-flex items-center gap-2 mb-6 ${persona.accentColor}`}>
                        <Icon className="h-8 w-8" />
                        <span className="text-sm font-semibold uppercase tracking-wider">
                            For {persona.label}
                        </span>
                    </div>

                    <h3 className="text-3xl font-bold text-foreground mb-4">
                        {persona.title}
                    </h3>

                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        {persona.description}
                    </p>

                    {/* Benefits List */}
                    <ul className="space-y-3">
                        {persona.benefits.map((benefit, idx) => (
                            <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="flex items-start gap-3"
                            >
                                <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center ${persona.accentColor} bg-current/10 shrink-0`}>
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-foreground">{benefit}</span>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* Right: Visual/UI Mockup */}
                <div className="relative">
                    <PersonaMockup persona={persona} />
                </div>
            </div>
        </div>
    )
}

/**
 * Persona-specific UI Mockup
 */
function PersonaMockup({ persona }: { persona: typeof personas[0] }) {
    // Different mockups per persona
    if (persona.id === "students") {
        return (
            <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20" />
                        <div className="flex-1">
                            <div className="h-3 w-32 bg-foreground/80 rounded mb-1" />
                            <div className="h-2 w-24 bg-muted-foreground/50 rounded" />
                        </div>
                        <div className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-500 text-xs font-bold">
                            92%
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        CS Major • Looking for hackathon team
                    </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-background/50 backdrop-blur-sm opacity-80">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20" />
                        <div className="flex-1">
                            <div className="h-3 w-28 bg-foreground/80 rounded mb-1" />
                            <div className="h-2 w-20 bg-muted-foreground/50 rounded" />
                        </div>
                        <div className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-500 text-xs font-bold">
                            88%
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Designer • Building portfolio project
                    </div>
                </div>
            </div>
        )
    }

    if (persona.id === "founders") {
        return (
            <div className="space-y-3">
                <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-purple-500/20" />
                        <div className="flex-1">
                            <div className="h-3 w-32 bg-foreground/80 rounded mb-1" />
                            <div className="h-2 w-28 bg-muted-foreground/50 rounded" />
                        </div>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 text-xs">React</span>
                        <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 text-xs">Node.js</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        "Looking for business co-founder..."
                    </div>
                </div>
            </div>
        )
    }

    // Mentors
    return (
        <div className="space-y-3">
            <div className="p-4 rounded-lg border border-border bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <BadgeCheck className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 w-32 bg-foreground/80 rounded mb-1" />
                        <div className="h-2 w-24 bg-muted-foreground/50 rounded" />
                    </div>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                    Available for mentorship
                </div>
                <div className="text-xs text-muted-foreground">
                    10 years in SaaS • Angel investor
                </div>
            </div>
        </div>
    )
}
