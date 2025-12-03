"use client"

import "./landing.css"
import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/features/landing/landing-header"
import { FeatureCard } from "@/components/features/landing/feature-card"
import { StatCard } from "@/components/features/landing/stat-card"
import { Hero3DViewer } from "@/components/features/landing/hero-3d-viewer"
import { MeshGradientBackground } from "@/components/features/landing/mesh-gradient-background"
import ScrollFloat from "@/components/ScrollFloat"
import { LogoLoop } from "@/components/LogoLoop"
import { motion } from "motion/react"

// Import animated icons from public/icons
import { Network } from "@/public/icons/Network"
import { Users } from "@/public/icons/Users"
import { Layers } from "@/public/icons/Layers"
import { Code } from "@/public/icons/Code"
import { Cpu } from "@/public/icons/Cpu"
import { Box } from "@/public/icons/Box"
import { WandSparkles } from "@/public/icons/WandSparkles"
import { ChartLine } from "@/public/icons/ChartLine"
import { ChartColumn } from "@/public/icons/ChartColumn"
import { ChartPie } from "@/public/icons/ChartPie"
import { Linkedin } from "@/public/icons/Linkedin"
import { AtSign } from "@/public/icons/AtSign"
import { Globe } from "@/public/icons/Globe"
import { HeartHandshake } from "@/public/icons/HeartHandshake"
import { BadgeCheck } from "@/public/icons/BadgeCheck"

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

const technologies = [
    {
        title: "Modern Frontend",
        description: "Built with Next.js, React, and cutting-edge web technologies for the best user experience.",
        icon: Cpu,
    },
    {
        title: "Scalable Backend",
        description: "Powered by cloud-native architecture ensuring 99.9% uptime and instant scalability.",
        icon: Box,
    },
    {
        title: "AI-Powered Features",
        description: "Leverage machine learning and AI to automate workflows and gain intelligent insights.",
        icon: WandSparkles,
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

export default function LandingPage() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <MeshGradientBackground />
            <LandingHeader />

            {/* Hero Section with Background Model */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background 3D Model */}
                <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
                    <Hero3DViewer />
                </div>

                {/* Content Overlay */}
                <div className="container relative z-10 mx-auto px-6 lg:px-8 text-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-4xl mx-auto pointer-events-auto"
                    >
                        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl mb-6 text-foreground drop-shadow-lg">
                            Innovate.
                            <br />
                            Collaborate.
                            <br />
                            Create.
                        </h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="mb-10 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto drop-shadow-md bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-white/10"
                        >
                            The ultimate collaboration platform for modern teams.
                            Connect, create, and innovate together with powerful tools designed for success.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:scale-105 transition-transform duration-300">
                                <Link href="/register">Get Started Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:scale-105 transition-transform duration-300">
                                <Link href="#features">Learn More</Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-24 sm:py-32">
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <ScrollFloat
                            containerClassName="mb-4"
                            scrollStart="top bottom"
                            scrollEnd="center center"
                            textClassName="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                        >
                            Powerful Features for Modern Teams
                        </ScrollFloat>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to collaborate effectively and build amazing things together.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                            >
                                <FeatureCard
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">
                            Built with Cutting-Edge Technology
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Leveraging the latest innovations to deliver exceptional performance and reliability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {technologies.map((tech, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-card/50 group"
                            >
                                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                    <tech.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{tech.title}</h3>
                                <p className="text-muted-foreground">{tech.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
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
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

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
