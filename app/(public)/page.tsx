"use client"
// Performance optimized - Dec 5, 2025

import "./landing.css"
import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/features/landing/landing-header"

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
const KeyBenefits = dynamic(() => import("@/components/features/landing/key-benefits").then(m => ({ default: m.KeyBenefits })), { ssr: true })
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


export default function LandingPage() {
    const [activeStep, setActiveStep] = React.useState(0)
    return (
        <div className="min-h-screen overflow-x-hidden bg-background relative">
            <MeshGradientBackground />
            <LandingHeader />

            {/* Hero Section with Two Column Design */}
            <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center pt-24 lg:pt-20 overflow-hidden">
                <div className="container relative z-10 mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                                    className="mb-8 lg:mb-10 text-lg leading-8 text-muted-foreground sm:text-xl text-left"
                                >
                                    Find co-founders, teammates, and opportunities using semantic matching powered by vector embeddings. Collabryx connects you based on skills, interests, and goals—not keywords.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <div className="relative inline-block w-full sm:w-auto">
                                        <Button size="lg" asChild className="w-full sm:w-auto text-lg px-8 shadow-lg hover:scale-105 transition-transform duration-300 relative z-10">
                                            <Link href="/register">Start Free</Link>
                                        </Button>
                                        <BorderBeam
                                            size={200}
                                            duration={8}
                                            colorFrom="hsl(var(--primary))"
                                            colorTo="hsl(var(--primary) / 0.2)"
                                        />
                                    </div>
                                    <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-lg px-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:scale-105 transition-transform duration-300">
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
                            className="relative h-[300px] lg:h-[500px] hidden md:flex items-center justify-end"
                        >
                            <GlobeBackground className="max-w-[400px] lg:max-w-[600px]" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Marquee Section - Full Width */}
            <section className="py-12 sm:py-20 relative overflow-hidden w-full">
                <div className="w-full">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-8 lg:mb-12">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl mb-4">
                                Trusted by Students, Founders & University Communities
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground">
                                See how Collabryx helps users build projects faster and smarter.
                            </p>
                        </div>
                    </div>

                    <Marquee pauseOnHover className="[--duration:60s]">
                        {testimonials.map((testimonial, idx) => (
                            <div
                                key={idx}
                                className="mx-4 w-[300px] sm:w-[350px] liquid-glass liquid-glass-interactive p-6"
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
            <div id="problem" data-section-name="Problem">
                <ProblemStatement />
            </div>

            {/* Semantic Engine - Show the Solution */}
            <div id="solution" data-section-name="Solution">
                <SemanticEngineComparison />
            </div>

            {/* Compatibility Score - Demonstrate Value */}
            <CompatibilityScoreShowcase />

            {/* AI Mentor - Additional Value Prop */}
            <AIMentorPreview />

            {/* Persona Use Cases - Targeted Messaging */}
            <div id="use-cases" data-section-name="Use Cases">
                <PersonaUseCases />
            </div>

            {/* Features Section - Feature Details */}
            <section id="features" data-section-name="Features" className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-12 lg:mb-16">
                    <div className="mx-auto max-w-2xl text-center mb-12 lg:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
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
                                className="group relative mx-4 w-[320px] sm:w-[380px] h-[280px] liquid-glass liquid-glass-interactive p-8 overflow-hidden flex flex-col whitespace-normal"
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
            <KeyBenefits />


            {/* How It Works - Process Breakdown */}
            <section id="how-it-works" data-section-name="How It Works" className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-12 lg:mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
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
                            className="relative p-6 sm:p-12 min-h-[400px] flex flex-col items-center justify-center text-center"
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
                                            className: "h-20 w-20 sm:h-24 sm:w-24"
                                        })}
                                    </motion.div>
                                </div>

                                {/* Title and Description */}
                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6"
                                >
                                    {howItWorksSteps[activeStep].title}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="text-base sm:text-lg text-muted-foreground leading-relaxed"
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
            <motion.section
                id="contact"
                data-section-name="Contact"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="py-24 sm:py-32 flex flex-col items-center text-center px-6 lg:px-8 relative z-10"
            >
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter max-w-3xl text-foreground">
                    Build Your Team with AI-Powered Matching
                </h2>
                <p className="mt-6 text-xl leading-relaxed text-zinc-400 max-w-md mx-auto">
                    Start forming your project or startup team in minutes — free for all students and founders.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                    <Button size="lg" asChild className="bg-white hover:bg-zinc-200 text-black font-medium text-base px-8 h-12 w-full sm:w-auto transition-colors">
                        <Link href="/register">Get Started for Free</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 font-medium text-base px-8 h-12 w-full sm:w-auto transition-colors">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </div>

                <div className="mt-16 sm:mt-20 flex gap-12 text-zinc-500">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 transform hover:scale-110">
                        <Linkedin className="w-7 h-7" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="mailto:hello@collabryx.com" className="hover:text-white transition-colors duration-300 transform hover:scale-110">
                        <AtSign className="w-7 h-7" />
                        <span className="sr-only">Email</span>
                    </a>
                    <a href="https://collabryx.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 transform hover:scale-110">
                        <Globe className="w-7 h-7" />
                        <span className="sr-only">Website</span>
                    </a>
                </div>
            </motion.section>

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
