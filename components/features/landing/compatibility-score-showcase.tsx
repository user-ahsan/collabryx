"use client"

import * as React from "react"
import { motion, useScroll, useTransform, MotionValue } from "framer-motion"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import { ShinyText } from "@/components/ui/shiny-text"
import { HeartHandshake } from "@/public/icons/HeartHandshake"
import { Code } from "@/public/icons/Code"
import { ChartLine } from "@/public/icons/ChartLine"

export function CompatibilityScoreShowcase() {
    const isMobile = useIsMobile()
    const prefersReducedMotion = usePrefersReducedMotion()
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Scroll-based parallax (desktop only)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    // Progressive enhancement: parallax only on desktop without reduced motion
    const enableParallax = !isMobile && !prefersReducedMotion

    return (
        <section ref={containerRef} className="relative py-24 sm:py-32 overflow-hidden">
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
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
                <div className="relative max-w-5xl mx-auto">
                    {enableParallax ? (
                        <ParallaxMatchCards scrollYProgress={scrollYProgress} />
                    ) : (
                        <StaticMatchCards />
                    )}
                </div>

                {/* Match Breakdown */}
                <MatchBreakdown />
            </div>
        </section>
    )
}

/**
 * Parallax version for desktop
 * Cards move from edges to center
 */
function ParallaxMatchCards({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
    const leftX = useTransform(scrollYProgress, [0, 0.5], [-200, 0])
    const rightX = useTransform(scrollYProgress, [0, 0.5], [200, 0])
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1])

    return (
        <div className="relative min-h-[500px] flex items-center justify-center">
            {/* Left Card - The Visionary */}
            <motion.div
                style={{ x: leftX, scale }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[280px]"
            >
                <ProfileCard
                    name="Sarah Chen"
                    role="The Visionary"
                    avatar="SC"
                    description="Founder with business strategy expertise looking for technical co-founder"
                    skills={["Business Strategy", "Marketing", "Fundraising"]}
                    icon={ChartLine}
                />
            </motion.div>

            {/* Center - Compatibility Score */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-10"
            >
                <CompatibilityRing percentage={94} />
            </motion.div>

            {/* Right Card - The Builder */}
            <motion.div
                style={{ x: rightX, scale }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px]"
            >
                <ProfileCard
                    name="Alex Kumar"
                    role="The Builder"
                    avatar="AK"
                    description="CS Student passionate about building scalable web applications"
                    skills={["React", "Node.js", "Python"]}
                    icon={Code}
                />
            </motion.div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                    d="M 280 250 Q 400 250 520 250"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.3 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                />
            </svg>
        </div>
    )
}

/**
 * Static version for mobile
 */
function StaticMatchCards() {
    return (
        <div className="relative">
            {/* Mobile: Stacked Layout */}
            <div className="flex flex-col md:grid md:grid-cols-3 gap-6 items-center">
                {/* Left Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <ProfileCard
                        name="Sarah Chen"
                        role="The Visionary"
                        avatar="SC"
                        description="Founder with business strategy expertise"
                        skills={["Business", "Marketing"]}
                        icon={ChartLine}
                    />
                </motion.div>

                {/* Center Score */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex justify-center"
                >
                    <CompatibilityRing percentage={94} />
                </motion.div>

                {/* Right Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <ProfileCard
                        name="Alex Kumar"
                        role="The Builder"
                        avatar="AK"
                        description="CS Student building web apps"
                        skills={["React", "Python"]}
                        icon={Code}
                    />
                </motion.div>
            </div>
        </div>
    )
}

/**
 * Profile Card Component
 */
function ProfileCard({
    name,
    role,
    avatar,
    description,
    skills,
    icon: Icon
}: {
    name: string
    role: string
    avatar: string
    description: string
    skills: string[]
    icon: React.ComponentType<{ className?: string }>
    // color prop removed
}) {
    return (
        <div className="relative p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            {/* Role Badge */}
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {role}
            </div>

            {/* Avatar */}
            <div className="mb-4 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/30">
                    {avatar}
                </div>
            </div>

            {/* Icon */}
            <div className="mb-3 flex justify-center">
                <Icon className="h-8 w-8 text-primary opacity-60" />
            </div>

            {/* Name */}
            <h3 className="text-lg font-bold text-foreground text-center mb-2">{name}</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">{description}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 justify-center">
                {skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                    </Badge>
                ))}
            </div>
        </div>
    )
}

/**
 * Compatibility Ring with Counter Animation
 */
function CompatibilityRing({ percentage }: { percentage: number }) {
    const [count, setCount] = React.useState(0)
    const [isInView, setIsInView] = React.useState(false)

    React.useEffect(() => {
        if (!isInView || count >= percentage) return

        const timer = setTimeout(() => {
            setCount((prev) => Math.min(prev + 2, percentage))
        }, 30)

        return () => clearTimeout(timer)
    }, [count, percentage, isInView])

    const circumference = 2 * Math.PI * 60 // radius = 60
    const strokeDashoffset = circumference - (count / 100) * circumference

    return (
        <motion.div
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true }}
            className="relative w-40 h-40 flex items-center justify-center"
        >
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                        transition: "stroke-dashoffset 0.3s ease"
                    }}
                />
            </svg>

            {/* Percentage Text */}
            <div className="relative z-10 text-center">
                <div className="text-4xl font-bold text-primary tabular-nums">
                    {count}%
                </div>
                <div className="text-xs text-muted-foreground font-medium">Match</div>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10" />
        </motion.div>
    )
}

/**
 * Match Breakdown - Why they matched
 */
function MatchBreakdown() {
    const matchReasons = [
        { label: "Complementary Skills", icon: "🤝", description: "Tech + Business expertise" },
        { label: "Shared Interest in Startups", icon: "🚀", description: "Both want to build products" },
        { label: "Matching Availability", icon: "📅", description: "Available to start ASAP" }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto"
        >
            <h3 className="text-xl font-bold text-center mb-8">The result: high-quality collaborators with complementary strengths</h3>
            <div className="grid sm:grid-cols-3 gap-6">
                {matchReasons.map((reason, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                        className="text-center p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors"
                    >
                        <div className="text-3xl mb-2">{reason.icon}</div>
                        <div className="font-semibold text-foreground mb-1">{reason.label}</div>
                        <div className="text-xs text-muted-foreground">{reason.description}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
