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
import { Linkedin } from "@/public/icons/Linkedin"
import { AtSign } from "@/public/icons/AtSign"
import { Globe } from "@/public/icons/Globe"
import { HeartHandshake } from "@/public/icons/HeartHandshake"
import { BadgeCheck } from "@/public/icons/BadgeCheck"
import { Activity } from "@/public/icons/Activity"
import { CircleFadingArrowUp } from "@/public/icons/CircleFadingArrowUp"
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
        title: "Profile Management",
        description: "Build rich profiles with skills, interests, and project goals that showcase who you are and what you're looking for.",
    },
    {
        icon: Users,
        title: "AI-Based Semantic Matching",
        description: "Vector embeddings understand your profile semantically, matching you with collaborators who complement your skills and vision.",
    },
    {
        icon: Layers,
        title: "Opportunity Discovery",
        description: "Browse curated matches, projects, and team opportunities. Our smart algorithm connects you with the right people and projects.",
    },
    {
        icon: Code,
        title: "AI Startup Assistant",
        description: "Get personalized startup guidance, MVP checklists, and project planning help from our context-aware AI assistant.",
    },
    {
        icon: HeartHandshake,
        title: "Secure Messaging",
        description: "Real-time messaging for faster team formation. Connect and collaborate with matched users effectively.",
    },
    {
        icon: BadgeCheck,
        title: "Basic Verification & Trust Indicators",
        description: "Build trust in the community with verification badges and reputation indicators for safer collaboration.",
    },
]

const stats = [
    {
        icon: Users,
        value: 200,
        suffix: "+",
        label: "Profile Records",
        description: "Prototype dataset",
    },
    {
        icon: Network,
        value: 80,
        suffix: "+",
        label: "Prototype Matches",
        description: "AI-powered connections",
    },
    {
        icon: HeartHandshake,
        value: 20,
        suffix: "+",
        label: "Test Collaborations",
        description: "Early success stories",
    },
]



const testimonials = [
    {
        name: "CS Student",
        handle: "@cs_undergrad",
        text: "Collabryx finally helped me find a team with complementary skills for my FYP.",
        avatar: "CS"
    },
    {
        name: "Early-Stage Founder",
        handle: "@startup_builder",
        text: "Semantic matching removes the guesswork. It's better than browsing groups manually.",
        avatar: "EF"
    },
    {
        name: "University Coordinator",
        handle: "@uni_coordinator",
        text: "Our student startup society uses Collabryx to help members form project teams efficiently.",
        avatar: "UC"
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
        icon: Network,
        title: "Accurate Semantic Matching",
        description: "Powered by modern embeddings that understand meaning, goals, and context—not just keywords.",
        highlight: "AI-Powered Intelligence"
    },
    {
        icon: Users,
        title: "Student & Founder Focused",
        description: "Designed specifically for students and early-stage founders building projects and startups.",
        highlight: "Built for Your Journey"
    },
    {
        icon: Code,
        title: "Built-in AI Assistant",
        description: "Get startup planning help, MVP checklists, and personalized guidance whenever you need it.",
        highlight: "24/7 Mentorship"
    },
    {
        icon: HeartHandshake,
        title: "Real-Time Messaging",
        description: "Simple, clean, student-friendly chat for faster team formation and collaboration.",
        highlight: "Instant Communication"
    }
]



export default function LandingPage() {
    const [activeStep, setActiveStep] = React.useState(0)
    return (
        <div className="min-h-screen overflow-x-hidden bg-background relative">
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
                                    Find co-founders, teammates, and opportunities using semantic matching powered by vector embeddings. Collabryx connects you based on skills, interests, and goals—not keywords.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <div className="relative inline-block">
                                        <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:scale-105 transition-transform duration-300 relative z-10">
                                            <Link href="/register">Start Free</Link>
                                        </Button>
                                        <BorderBeam
                                            size={200}
                                            duration={8}
                                            colorFrom="hsl(var(--primary))"
                                            colorTo="hsl(var(--primary) / 0.2)"
                                        />
                                    </div>
                                    <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:scale-105 transition-transform duration-300">
                                        <Link href="#features">See How It Works</Link>
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
                                Trusted by Students, Founders & University Communities
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                See how Collabryx helps users build projects faster and smarter.
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
                            Everything you need to find collaborators and build amazing things together.
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
                                Why Students & Founders Choose Collabryx
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Unique advantages designed for your journey.
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
                            Prototype Metrics (Demo Dataset)
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Early metrics from our prototype and testing phase.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
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
                            text="Build Your Team with AI-Powered Matching"
                            className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 text-foreground"
                            speed={6}
                        />
                        <p className="mb-12 text-xl text-muted-foreground max-w-2xl mx-auto">
                            Start forming your project or startup team in minutes — free for all students and founders.
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
