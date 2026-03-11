"use client"

import { motion } from "framer-motion"
import { ArrowRight, User, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

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
        <div className="space-y-8">
            <div className="text-center space-y-3">
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-foreground"
                >
                    Welcome to Collabryx
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-muted-foreground text-base"
                >
                    Let's set up your profile in just a few steps
                </motion.p>
            </div>

            <div className="grid gap-4">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                            <p className="text-muted-foreground text-xs">{feature.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
            >
                <Button 
                    onClick={onNext}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                >
                    Let's get started
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>
        </div>
    )
}
