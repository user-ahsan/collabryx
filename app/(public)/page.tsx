"use client"

import "./landing.css"
import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/features/landing/landing-header"
import { StatCard } from "@/components/features/landing/stat-card"
import { MorphingText } from "@/components/ui/morphing-text"
import { Globe as GlobeBackground } from "@/components/ui/globe"
import { MeshGradientBackground } from "@/components/features/landing/mesh-gradient-background"
import ScrollReveal from "@/components/ScrollReveal"
import { LogoLoop } from "@/components/LogoLoop"
import { Marquee } from "@/components/ui/marquee"
import { BorderBeam } from "@/components/ui/border-beam"
import { ScrollVelocityRow } from "@/components/ui/scroll-based-velocity"
import { motion } from "motion/react"

// Import animated icons from public/icons
import { Network } from "@/public/icons/Network"
import { Users } from "@/public/icons/Users"
import { Layers } from "@/public/icons/Layers"
import { Code } from "@/public/icons/Code"
import { ChartLine } from "@/public/icons/ChartLine"
import { ChartColumn } from "@/public/icons/ChartColumn"
import { ChartPie } from "@/public/icons/ChartPie"
import { Linkedin } from "@/public/icons/Linkedin"
import { AtSign } from "@/public/icons/AtSign"
import { Globe } from "@/public/icons/Globe"
import { HeartHandshake } from "@/public/icons/HeartHandshake"
import { BadgeCheck } from "@/public/icons/BadgeCheck"

const navigation = [
    { name: "Features", href: "#features" },
    { name: "Technology", href: "#technology" },
    { name: "Partners", href: "#partners" },
    { name: "Contact", href: "#contact" },
]

const features = [
    {
        icon: Network,
        title: "Seamless Collaboration",
        description: "Connect with team members in real-time. Share ideas, files, and feedback instantly across your organization.",
    },
    {
        icon: Users,
        title: "Powerful Community",
        description: "Join a thriving community of innovators. Network, learn, and grow together with like-minded professionals.",
    },
    {
        icon: Layers,
        title: "Advanced Platform",
        description: "Enterprise-grade infrastructure built for scale. Reliable, secure, and lightning-fast performance.",
    },
    {
        icon: Code,
        title: "Developer Tools",
        description: "Comprehensive APIs and SDKs. Integrate seamlessly with your existing workflow and tools.",
    },
]

const stats = [
    {
        icon: Users,
        value: 50000,
        suffix: "+",
        label: "Active Users",
        description: "Growing community worldwide",
    },
    {
        icon: BadgeCheck,
        value: 5000,
        suffix: "+",
        label: "Early Adopters",
        description: "Pioneering the future",
    },
    {
        icon: ChartColumn,
        value: 1000000,
        suffix: "+",
        label: "Collaborations",
        description: "Successful projects delivered",
    },
    {
        icon: ChartPie,
        value: 99,
        suffix: "%",
        label: "Success Rate",
        description: "Client satisfaction score",
    },
    {
        icon: ChartLine,
        value: 300,
        suffix: "%",
        label: "Growth",
        description: "Year-over-year expansion",
    },
]

const partnerLogos = [
    { src: "/placeholder-logo.png", alt: "Partner 1" },
    { src: "/placeholder-logo.png", alt: "Partner 2" },
    { src: "/placeholder-logo.png", alt: "Partner 3" },
    { src: "/placeholder-logo.png", alt: "Partner 4" },
    { src: "/placeholder-logo.png", alt: "Partner 5" },
    { src: "/placeholder-logo.png", alt: "Partner 6" },
]

const testimonials = [
    {
        name: "Sarah Johnson",
        handle: "@sarahj_dev",
        text: "Collabryx has completely transformed how our team collaborates. The real-time features are a game-changer!",
        avatar: "SJ"
    },
    {
        name: "Mike Chen",
        handle: "@mikechen_tech",
        text: "Finally, a platform that understands what modern teams need. Intuitive, powerful, and beautiful.",
        avatar: "MC"
    },
    {
        name: "Emma Watson",
        handle: "@emmaw_pm",
        text: "Best collaboration tool I've used in years. My team's productivity has skyrocketed! 🚀",
        avatar: "EW"
    },
    {
        name: "David Park",
        handle: "@davidp_founder",
        text: "We tried every tool out there. Collabryx is the only one that clicked with our entire team.",
        avatar: "DP"
    },
    {
        name: "Lisa Martinez",
        handle: "@lisamartinez",
        text: "The AI-powered features save us hours every week. It's like having an extra team member!",
        avatar: "LM"
    },
    {
        name: "James Wilson",
        handle: "@jameswilson_cto",
        text: "Seamless integration with our existing tools. Setup took minutes, not days.",
        avatar: "JW"
    },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <MeshGradientBackground />
            <LandingHeader navigation={navigation} />

            {/* Hero Section with Two Column Design */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                <div className="container relative z-10 mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Content - Centered and Left Aligned */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex flex-col justify-center"
                        >
                            <div className="max-w-xl">
                                <div className="text-left mb-6">
                                    <MorphingText
                                        texts={[
                                            "Innovate.",
                                            "Collaborate.",
                                            "Create.",
                                            "Transform.",
                                            "Connect."
                                        ]}
                                        className="text-foreground drop-shadow-lg"
                                    />
                                </div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                    className="mb-10 text-lg leading-8 text-muted-foreground sm:text-xl text-left"
                                >
                                    The ultimate collaboration platform for modern teams.
                                    Connect, create, and innovate together with powerful tools designed for success.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <div className="relative inline-block">
                                        <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:scale-105 transition-transform duration-300 relative z-10">
                                            <Link href="/register">Get Started Free</Link>
                                        </Button>
                                        <BorderBeam
                                            size={200}
                                            duration={8}
                                            colorFrom="hsl(var(--primary))"
                                            colorTo="hsl(var(--primary) / 0.2)"
                                        />
                                    </div>
                                    <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:scale-105 transition-transform duration-300">
                                        <Link href="#features">Learn More</Link>
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right Column: Globe Only */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="relative h-[500px] flex items-center justify-end"
                        >
                            <GlobeBackground className="max-w-[600px]" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Marquee Section - Full Width */}
            <section className="py-16 sm:py-20 relative overflow-hidden w-full">
                <div className="w-full">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-12">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                                Loved by Teams Worldwide
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                See what our users are saying about their experience.
                            </p>
                        </div>
                    </div>

                    <Marquee pauseOnHover className="[--duration:60s]">
                        {testimonials.map((testimonial, idx) => (
                            <div
                                key={idx}
                                className="mx-4 w-[350px] rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-card/50"
                            >
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.text}</p>
                            </div>
                        ))}
                    </Marquee>
                </div>
            </section>

            {/* Features Section with Scroll Velocity */}
            <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-16">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <ScrollReveal
                            containerClassName="mb-4"
                            textClassName="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                            enableBlur={true}
                            baseOpacity={0.2}
                            baseRotation={2}
                            blurStrength={6}
                            rotationEnd="center center"
                            wordAnimationEnd="center center"
                        >
                            Powerful Features for Modern Teams
                        </ScrollReveal>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to collaborate effectively and build amazing things together.
                        </p>
                    </div>
                </div>

                {/* Screen-wide scrolling feature cards */}
                <ScrollVelocityRow baseVelocity={2} className="py-4">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={idx}
                                className="group relative mx-4 w-[380px] h-[280px] rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-card/60 hover:border-primary/50 overflow-hidden flex flex-col whitespace-normal"
                            >
                                {/* BorderBeam on hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <BorderBeam
                                        size={150}
                                        duration={8}
                                        delay={idx * 0.5}
                                        colorFrom="hsl(var(--primary))"
                                        colorTo="hsl(var(--primary) / 0.2)"
                                    />
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110 shrink-0">
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <h3 className="mb-3 text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300 shrink-0">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </ScrollVelocityRow>
            </section>


            {/* Partners Section */}
            <section id="partners" className="py-32 sm:py-40 relative overflow-hidden">
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center mb-20">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 rounded-full bg-primary/10 backdrop-blur-sm animate-pulse">
                                <HeartHandshake className="h-16 w-16 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 text-foreground">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Join thousands of companies already collaborating on Collabryx.
                            <br />
                            From startups to enterprises, teams trust us to power their collaboration.
                        </p>
                    </div>

                    <div className="relative">
                        <LogoLoop
                            logos={partnerLogos}
                            speed={50}
                            direction="left"
                            pauseOnHover
                            fadeOut
                            logoHeight={80}
                            gap={80}
                        />
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">
                            Impact That Matters
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Real numbers from real teams making real progress.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
                        {stats.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                icon={stat.icon}
                                value={stat.value}
                                suffix={stat.suffix}
                                label={stat.label}
                                description={stat.description}
                                className="bg-card/30"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="relative py-32 sm:py-40 overflow-hidden">
                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl p-12 sm:p-16 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="text-center relative z-10">
                            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 text-foreground">
                                Ready to find your perfect match?
                            </h2>
                            <p className="mb-12 text-xl text-muted-foreground max-w-2xl mx-auto">
                                Join thousands of students and founders who are building the future together.
                                Start your free trial today—no credit card required.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                                <Button size="lg" asChild className="text-lg px-10 py-6 h-auto shadow-lg hover:shadow-primary/25 transition-all duration-300">
                                    <Link href="/register">Get Started for Free</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="text-lg px-10 py-6 h-auto bg-transparent hover:bg-background/50">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                            </div>

                            {/* Social Links */}
                            <div className="flex justify-center gap-8 pt-8 border-t border-border/50">
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                                    <Linkedin className="h-7 w-7" />
                                    <span className="sr-only">LinkedIn</span>
                                </a>
                                <a href="mailto:hello@collabryx.com" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                                    <AtSign className="h-7 w-7" />
                                    <span className="sr-only">Email</span>
                                </a>
                                <a href="https://collabryx.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                                    <Globe className="h-7 w-7" />
                                    <span className="sr-only">Website</span>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 bg-background/50 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Collabryx. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
