"use client"

import { motion } from "framer-motion"
import { ArrowRight, User, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface StepWelcomeProps {
    onNext?: () => void
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
    const features = [
        {
            icon: User,
            title: "Your Profile",
            description: "Tell us about yourself"
        },
        {
            icon: Zap,
            title: "Skills & Interests",
            description: "What you do best"
        },
        {
            icon: Sparkles,
            title: "Experience",
            description: "Your professional journey"
        }
    ]

    return (
        <div className="space-y-10 py-6">
            {/* Welcome Header - Enhanced for full screen */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 mb-4"
                >
                    <span className="text-primary-foreground font-bold text-4xl">C</span>
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight"
                >
                    Welcome to Collabryx
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto"
                >
                    Let&apos;s set up your profile in just a few steps
                </motion.p>
            </div>

            {/* Feature Cards - Enhanced layout */}
            <div className="grid gap-5 md:grid-cols-3">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className={cn(
                            "flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1",
                            glass("subtle"),
                            "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                        )}
                    >
                        <div className={cn(
                            "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 mb-4 backdrop-blur-sm",
                            glass("badge")
                        )}>
                            <feature.icon className="w-7 h-7 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground text-base mb-1">{feature.title}</p>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </motion.div>
                ))}
            </div>

            {/* CTA Button - Enhanced */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-4"
            >
                <Button 
                    onClick={onNext}
                    className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    size="lg"
                >
                    Let&apos;s get started
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>
        </div>
    )
}
