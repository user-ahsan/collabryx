"use client"

import "./landing.css"
import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/features/landing/landing-header"
import { Hero3DBackground } from "@/components/features/landing/hero-3d-background"
import { FeatureCard } from "@/components/features/landing/feature-card"
import { StatCard } from "@/components/features/landing/stat-card"
import { GridScan } from "@/components/GridScan"
import Orb from "@/components/Orb"
import { LogoLoop } from "@/components/LogoLoop"

// Import animated icons from public/icons
import { Rocket } from "@/public/icons/Rocket"
import { Sparkles } from "@/public/icons/Sparkles"
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
        <div className="min-h-screen overflow-x-hidden">
            <LandingHeader />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <Hero3DBackground />

                <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 lg:px-8">
                    <div className="text-center">
                        {/* Icon decoration */}
                        <div className="mb-6 flex justify-center gap-4">
                            <div className="animate-bounce">
                                <Rocket className="h-12 w-12 text-primary" />
                            </div>
                            <div className="animate-pulse">
                                <Sparkles className="h-12 w-12 text-purple-500" />
                            </div>
                        </div>

                        {/* Main headline */}
                        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
                            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                Innovate.
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Collaborate.
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Create.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-foreground/80 sm:text-xl">
                            The ultimate collaboration platform for modern teams.
                            Connect, create, and innovate together with powerful tools designed for success.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="text-lg px-8">
                                <Link href="/register">Get Started Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-8">
                                <Link href="#features">Learn More</Link>
                            </Button>
                        </div>

                        {/* Scroll indicator */}
                        <div className="mt-16 animate-bounce">
                            <svg
                                className="mx-auto h-6 w-6 text-foreground/50"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-24 sm:py-32">
                <GridScan
                    gridScale={0.1}
                    lineThickness={1}
                    linesColor="#392e4e"
                    scanColor="#FF9FFC"
                    scanDuration={5}
                    className="absolute inset-0 opacity-30"
                />

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">
                            Powerful Features for Modern Teams
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to collaborate effectively and build amazing things together.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, idx) => (
                            <FeatureCard
                                key={idx}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
                    <Orb hue={270} hoverIntensity={0.3} rotateOnHover />
                </div>

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
                            <div
                                key={idx}
                                className="p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <tech.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{tech.title}</h3>
                                <p className="text-muted-foreground">{tech.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section id="partners" className="py-24 sm:py-32 bg-muted/30">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <div className="mb-4 flex justify-center">
                            <HeartHandshake className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Join thousands of companies already collaborating on Collabryx.
                        </p>
                    </div>

                    <LogoLoop
                        logos={partnerLogos}
                        speed={50}
                        direction="left"
                        pauseOnHover
                        fadeOut
                        logoHeight={60}
                        gap={60}
                    />
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

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                icon={stat.icon}
                                value={stat.value}
                                suffix={stat.suffix}
                                label={stat.label}
                                description={stat.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10" />

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="mb-10 text-lg text-muted-foreground">
                            Join thousands of teams already collaborating on Collabryx.
                            Start your free trial today—no credit card required.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Button size="lg" asChild className="text-lg px-8">
                                <Link href="/register">Start Free Trial</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-8">
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </div>

                        {/* Social Links */}
                        <div className="flex justify-center gap-6">
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="h-6 w-6" />
                                <span className="sr-only">LinkedIn</span>
                            </a>
                            <a href="mailto:hello@collabryx.com" className="text-muted-foreground hover:text-primary transition-colors">
                                <AtSign className="h-6 w-6" />
                                <span className="sr-only">Email</span>
                            </a>
                            <a href="https://collabryx.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Globe className="h-6 w-6" />
                                <span className="sr-only">Website</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Collabryx. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
