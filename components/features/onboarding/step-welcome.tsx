"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StepWelcomeProps {
    onNext?: () => void
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
    return (
        <div className="space-y-8 py-6">
            {/* Welcome Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary shadow-2xl shadow-primary/30 mb-4">
                    <span className="text-primary-foreground font-bold text-4xl">C</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                    Welcome to Collabryx
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
                    Let&apos;s set up your profile in just a few steps
                </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
                <Button 
                    onClick={onNext}
                    className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    size="lg"
                >
                    Let&apos;s get started
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    )
}
