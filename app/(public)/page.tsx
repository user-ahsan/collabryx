"use client"
// Performance optimized - Dec 5, 2025

import "./landing.css"
import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/features/landing/landing-header"
import { StatCard } from "@/components/features/landing/stat-card"
import { MorphingText } from "@/components/ui/morphing-text"
import { Globe as GlobeBackground } from "@/components/ui/globe"
import { MeshGradientBackground } from "@/components/features/landing/mesh-gradient-background"
import { Marquee } from "@/components/ui/marquee"
import { BorderBeam } from "@/components/ui/border-beam"
import { ScrollVelocityRow } from "@/components/ui/scroll-based-velocity"
import { ShinyText } from "@/components/ui/shiny-text"
import { motion } from "motion/react"

// Lazy load heavy sections for better performance
const ProblemStatement = dynamic(() => import("@/components/features/landing/problem-statement").then(m => ({ default: m.ProblemStatement })), { ssr: true })
const SemanticEngineComparison = dynamic(() => import("@/components/features/landing/semantic-engine-comparison").then(m => ({ default: m.SemanticEngineComparison })), { ssr: true })
const CompatibilityScoreShowcase = dynamic(() => import("@/components/features/landing/compatibility-score-showcase").then(m => ({ default: m.CompatibilityScoreShowcase })), { ssr: true })
const AIMentorPreview = dynamic(() => import("@/components/features/landing/ai-mentor-preview").then(m => ({ default: m.AIMentorPreview })), { ssr: true })
// Disable SSR for PersonaUseCases due to Radix Tabs hydration mismatch with auto-generated IDs
const PersonaUseCases = dynamic(() => import("@/components/features/landing/persona-use-cases").then(m => ({ default: m.PersonaUseCases })), { ssr: false })

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
import { Activity } from "@/public/icons/Activity"
import { Blocks } from "@/public/icons/Blocks"
import { CircleFadingArrowUp } from "@/public/icons/CircleFadingArrowUp"
import { Bolt } from "@/public/icons/Bolt"
import { ChevronLeft } from "@/public/icons/ChevronLeft"
import { ChevronRight } from "@/public/icons/ChevronRight"

const navigation = [
    { name: "Features", href: "#features" },
    { name: "Benefits", href: "#benefits" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Partners", href: "#partners" },
    { name: "Contact", href: "#contact" },
]

const features = [
    {
        icon: Network,
        title: "AI-Powered Matching",
        description: "Vector embeddings understand your profile semantically, matching you with collaborators who complement your skills and vision.",
    },
    {
        icon: Users,
        title: "Student & Founder Network",
        description: "Join a community of ambitious students, fresh graduates, and early-stage founders building the future together.",
    },
    {
        icon: Layers,
        title: "Smart Compatibility Scores",
        description: "See why you match with each person. Our AI breaks down compatibility by skills, interests, and availability.",
    },
    {
        icon: Code,
        title: "24/7 AI Mentor",
        description: "Get personalized startup guidance, MVP checklists, and project planning help from our context-aware AI assistant.",
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

const howItWorksSteps = [
    {
        step: 1,
        icon: Activity,
        title: "Create Your Profile",
        description: "Sign up in seconds and build your professional profile. Add your skills, interests, and what you're looking to collaborate on."
    },
    {
        step: 2,
        icon: Network,
        title: "Discover Opportunities",
        description: "Browse curated matches, projects, and team opportunities. Our smart algorithm connects you with the right people and projects."
    },
    {
        step: 3,
        icon: Users,
        title: "Connect & Collaborate",
        description: "Reach out to potential collaborators, join teams, and start building amazing projects together in real-time."
    },
    {
        step: 4,
        icon: CircleFadingArrowUp,
        title: "Build & Launch",
        description: "Use our integrated tools to manage projects, track progress, and bring your ideas to life with your team."
    }
]

const keyBenefits = [
    {
        icon: Layers,
        title: "Enterprise-Grade Security",
        description: "Bank-level encryption and SOC 2 compliance. Your data and intellectual property are always protected.",
        highlight: "99.99% Uptime SLA"
    },
    {
        icon: Bolt,
        title: "Lightning Fast Performance",
        description: "Built on cutting-edge infrastructure. Real-time collaboration with zero lag, anywhere in the world.",
        highlight: "<50ms Response Time"
    },
    {
        icon: Users,
        title: "Smart Matching Algorithm",
        description: "AI-powered recommendations connect you with complementary skills and shared goals for maximum synergy.",
        highlight: "92% Match Success Rate"
    },
    {
        icon: Blocks,
        title: "Seamless Integrations",
        description: "Works with tools you already love. GitHub, Slack, Figma, and 50+ more integrations out of the box.",
        highlight: "50+ Native Integrations"
    }
]

const integrations = [
    { name: "GitHub", category: "Development" },
    { name: "Slack", category: "Communication" },
    { name: "Figma", category: "Design" },
    { name: "Notion", category: "Productivity" },
    { name: "Linear", category: "Project Management" },
    { name: "Vercel", category: "Deployment" },
    { name: "Discord", category: "Communication" },
    { name: "Jira", category: "Project Management" },
]

export default function LandingPage() {
    const [activeStep, setActiveStep] = React.useState(0)
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
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="mb-10 text-lg leading-8 text-muted-foreground sm:text-xl text-left"
                                >
                                    Find your perfect collaborator with AI-powered semantic matching.
                                    Connect students, founders, and mentors based on goals—not just keywords.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
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

            {/* Problem Statement - Establish the Pain Point */}
            <ProblemStatement />

            {/* Semantic Engine - Show the Solution */}
            <SemanticEngineComparison />

            {/* Compatibility Score - Demonstrate Value */}
            <CompatibilityScoreShowcase />

            {/* AI Mentor - Additional Value Prop */}
            <AIMentorPreview />

            {/* Persona Use Cases - Targeted Messaging */}
            <PersonaUseCases />

            {/* Features Section - Feature Details */}
            <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-16">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                        >
                            Powerful Features for Modern Teams
                        </motion.h2>
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


            {/* Key Benefits Section */}
            <section id="benefits" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                                Why Teams Choose Collabryx
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Unique advantages that set us apart from the competition.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {keyBenefits.map((benefit, idx) => {
                            const Icon = benefit.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    className="group relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-card/60 overflow-hidden"
                                >
                                    {/* BorderBeam on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <BorderBeam
                                            size={200}
                                            duration={10}
                                            delay={idx * 0.3}
                                            colorFrom="hsl(var(--primary))"
                                            colorTo="hsl(var(--primary) / 0.2)"
                                        />
                                    </div>

                                    <div className="relative z-10">
                                        {/* Transparent icon container with animated icon */}
                                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center text-primary group-hover:scale-125 transition-all duration-500">
                                            <Icon className="h-16 w-16 transition-transform" />
                                        </div>
                                        <h3 className="mb-3 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-muted-foreground mb-4">
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

            {/* Statistics Section - Social Proof with Numbers */}
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

            {/* How It Works - Process Breakdown */}
            <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
                        >
                            How It Works
                        </motion.h2>
                        <p className="text-lg text-muted-foreground">
                            Get started in minutes and collaborate like never before.
                        </p>
                    </div>

                    {/* Interactive Stepper */}
                    <div className="relative max-w-4xl mx-auto">
                        {/* Step Content with Spring Animation */}
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 100,
                                damping: 15
                            }}
                            className="relative p-12 min-h-[400px] flex flex-col items-center justify-center text-center"
                        >

                            <div className="relative z-10 max-w-2xl flex flex-col items-center">
                                {/* Step Number - ON TOP */}
                                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/25">
                                    {howItWorksSteps[activeStep].step}
                                </div>

                                {/* Animated Icon - BELOW Step Number */}
                                <div className="mb-8 inline-flex items-center justify-center text-primary">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                                    >
                                        {React.createElement(howItWorksSteps[activeStep].icon, {
                                            className: "h-24 w-24"
                                        })}
                                    </motion.div>
                                </div>

                                {/* Title and Description */}
                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-3xl font-bold text-foreground mb-6"
                                >
                                    {howItWorksSteps[activeStep].title}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="text-lg text-muted-foreground leading-relaxed"
                                >
                                    {howItWorksSteps[activeStep].description}
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Navigation Arrows */}
                        <div className="flex justify-center items-center gap-6 mt-8">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                disabled={activeStep === 0}
                                className="group flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                                Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setActiveStep(Math.min(howItWorksSteps.length - 1, activeStep + 1))}
                                disabled={activeStep === howItWorksSteps.length - 1}
                                className="group flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>

                        {/* Step Indicator Dots - NOW AT BOTTOM */}
                        <div className="flex justify-center gap-3 mt-8">
                            {howItWorksSteps.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveStep(idx)}
                                    className={`h-2 rounded-full transition-all duration-300 ${activeStep === idx ? 'w-12 bg-primary' : 'w-2 bg-border hover:bg-primary/50'
                                        }`}
                                    aria-label={`Go to step ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="relative py-32 sm:py-40 overflow-hidden">
                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    {/* CTA Section with Enhanced Animations */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            stiffness: 80,
                            damping: 12
                        }}
                        className="relative text-center rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm p-12 overflow-hidden"
                    >
                        {/* BorderBeam Effect */}
                        <BorderBeam size={300} duration={10} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--primary) / 0.1)" />

                        <ShinyText
                            text="Ready to Find Your Co-Founder?"
                            className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 text-foreground"
                            speed={6}
                        />
                        <p className="mb-12 text-xl text-muted-foreground max-w-2xl mx-auto">
                            Join thousands of students and founders using AI-powered matching to build amazing projects.
                            Start discovering your perfect collaborators today—completely free.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Button size="lg" asChild className="text-lg px-10 py-6 h-auto shadow-lg hover:shadow-primary/25 transition-all duration-300">
                                <Link href="/register">Get Started for Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-10 py-6 h-auto hover:bg-background/50">
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
                    </motion.div>
                </div>
            </section>

            {/* Footer with Scroll-Reveal */}
            <motion.footer
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="border-t border-border/40 py-12 bg-background/50 backdrop-blur-sm"
            >
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Collabryx. All rights reserved.
                    </p>
                </div>
            </motion.footer>
        </div>
    )
}
