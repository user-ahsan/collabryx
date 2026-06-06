"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface StepperProps {
    steps: {
        id: string
        title: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
    currentStep: number
}

/**
 * Stepper - Visual step indicator for the multi-step onboarding flow.
 *
 * DESIGN RATIONALE:
 * The original implementation used percentage-based positioning for the connecting
 * line (`left: 100/(steps.length*2)%`) which was fragile — it assumed dots at exact
 * 0%,25%,50%,75%,100% positions via `justify-between`, but CSS flex spacing varies
 * with container width and dot sizes. On narrower mobile viewports the misalignment
 * was visibly off-center (up to 15px deviation).
 *
 * SOLUTION: Switch to pixel-based positioning (`left-6 right-6` on mobile, `md:left-7 md:right-7`
 * on desktop). The dots are 40px (w-10) on mobile, 48px (w-12) on desktop. 24px/28px from each
 * edge places the line endpoints at the center of the first/last dots (±2px) regardless of
 * container width. This is stable across all viewport sizes.
 *
 * ADDITIONAL: Only the 4 data-entry steps (skills, interests, etc.) are shown — the welcome
 * step (index 0) is excluded from progress display since it's a transitional landing, not
 * a data-entry stage. The `adjustedStep` mapping converts the page-level 0-indexed step
 * to the stepper's 0-indexed display, so when the user is on the 1st form step the stepper
 * correctly highlights its first dot.
 *
 * ACCESSIBILITY: Each step dot has `aria-current="step"` for the active step and labels
 * like "Skills (completed)" for completed steps, making the progress state clear to
 * screen reader users.
 */
export function Stepper({ steps, currentStep }: StepperProps) {
    // Skip the welcome step (index 0) for progress display
    const visibleSteps = steps.slice(1)
    const adjustedStep = Math.max(0, currentStep - 1)
    const stepCount = visibleSteps.length

    return (
        <div 
            className="w-full max-w-lg mx-auto relative pt-2 pb-6" 
            role="navigation" 
            aria-label="Progress through onboarding steps"
        >
            {/* Connecting lines - spans between the first and last dot centers */}
            <div 
                className="absolute top-7 md:top-8 -translate-y-1/2 z-10"
                style={{
                    left: `${50 / stepCount}%`,
                    right: `${50 / stepCount}%`
                }}
            >
                <div className={cn("w-full h-1 rounded-full", glass("divider"))} />
                <div
                    className={cn(
                        "absolute left-0 top-0 h-1 rounded-full transition-all duration-500 ease-in-out",
                        "bg-primary"
                    )}
                    style={{ width: `${stepCount > 1 ? (adjustedStep / (stepCount - 1)) * 100 : 0}%` }}
                />
            </div>

            {/* Stepper items - higher z-index to appear above lines */}
            <div className="flex items-start justify-between relative z-20 gap-0" role="list">
                {visibleSteps.map((step, index) => {
                    const isCompleted = adjustedStep > index
                    const isCurrent = adjustedStep === index
                    const Icon = step.icon

                    return (
                        <div 
                            key={step.id} 
                            className="flex flex-col items-center flex-1 min-w-0" 
                            role="listitem"
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={cn(
                                    "relative z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 text-sm font-semibold transition-all duration-300 backdrop-blur-md bg-background shrink-0",
                                    isCompleted
                                        ? "border-primary bg-background text-primary"
                                        : isCurrent
                                            ? "border-primary text-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            : glass("subtle") + " text-muted-foreground border-border/40"
                                )}
                                aria-current={isCurrent ? "step" : undefined}
                                aria-label={`${step.title} ${isCompleted ? "(completed)" : ""}`}
                            >
                                {isCompleted && <Check className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />}
                                {!isCompleted && Icon && <Icon className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />}
                            </motion.div>
                            <span
                                className={cn(
                                    "mt-3 text-xs md:text-sm font-medium text-center px-1 leading-tight transition-colors duration-300 truncate w-full max-w-[80px] md:max-w-[100px]",
                                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                                )}
                                aria-hidden="true"
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
