"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
    steps: {
        id: string
        title: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
    currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="w-full max-w-lg mx-auto relative pt-2 pb-6">
            {/* Connecting lines container */}
            <div className="absolute left-[10%] right-[10%] top-6 -translate-y-1/2">
                <div className="w-full h-1 rounded-full bg-border/40" />
                <div
                    className="absolute left-0 top-0 h-1 rounded-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
            </div>

            {/* Stepper items */}
            <div className="flex items-start justify-between relative z-10">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > index
                    const isCurrent = currentStep === index
                    const Icon = step.icon

                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 text-sm font-semibold transition-all duration-300",
                                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                        isCurrent ? "bg-background border-primary text-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]" :
                                            "bg-muted border-border text-muted-foreground"
                                )}
                            >
                                {isCompleted && <Check className="w-5 h-5" />}
                                {!isCompleted && Icon && <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                                {!isCompleted && !Icon && <span>{index + 1}</span>}
                            </motion.div>
                            <span
                                className={cn(
                                    "mt-3 text-xs md:text-sm font-medium text-center max-w-[80px] leading-tight transition-colors duration-300",
                                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {step.title}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
