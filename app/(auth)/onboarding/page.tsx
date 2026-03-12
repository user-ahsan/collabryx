"use client"

import React, { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowRight, ArrowLeft, User, Code2, Target, Briefcase, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/features/onboarding/stepper"
import { StepWelcome } from "@/components/features/onboarding/step-welcome"
import { StepBasicInfo } from "@/components/features/onboarding/step-basic-info"
import { StepSkills } from "@/components/features/onboarding/step-skills"
import { StepInterestsAndGoals } from "@/components/features/onboarding/step-interests-goals"
import { StepExperience } from "@/components/features/onboarding/step-experience"
import { GlassCard } from "@/components/shared/glass-card"
import { createClient } from "@/lib/supabase/client"
import { completeOnboarding } from "./actions"

// Schemas for each step
const basicInfoSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    displayName: z.string().optional(),
    headline: z.string().min(2, "Headline must be at least 2 characters."),
    location: z.string().optional(),
})

const skillsSchema = z.object({
    skills: z.array(z.string()).min(1, "Please add at least one skill."),
})

const interestsGoalsSchema = z.object({
    interests: z.array(z.string()).min(1, "Please add at least one interest."),
    goals: z.array(z.string()).optional(),
})

const experienceSchema = z.object({
    experiences: z.array(z.object({
        title: z.string().optional(),
        company: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
    links: z.array(z.object({
        platform: z.string(),
        url: z.string().optional(),
    })).optional(),
})

const combinedSchema = z.object({
    ...basicInfoSchema.shape,
    ...skillsSchema.shape,
    ...interestsGoalsSchema.shape,
    ...experienceSchema.shape,
});

type OnboardingFormValues = z.infer<typeof combinedSchema>

const STEPS = [
    { id: "welcome", title: "Welcome", component: StepWelcome, icon: Sparkles },
    { id: "basic-info", title: "Basic Info", component: StepBasicInfo, schema: basicInfoSchema, icon: User },
    { id: "skills", title: "Skills", component: StepSkills, schema: skillsSchema, icon: Code2 },
    { id: "interests-goals", title: "Interests & Goals", component: StepInterestsAndGoals, schema: interestsGoalsSchema, icon: Target },
    { id: "experience", title: "Experience", component: StepExperience, schema: experienceSchema, icon: Briefcase },
]

const transition = {
    duration: 0.4,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
}

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userName, setUserName] = useState("")
    const router = useRouter()

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(combinedSchema),
        mode: "onBlur",
        defaultValues: {
            fullName: "",
            displayName: "",
            headline: "",
            location: "",
            skills: [],
            interests: [],
            goals: [],
            experiences: [],
            links: []
        }
    })

    const { handleSubmit, trigger } = methods
    const isLastStep = currentStep === STEPS.length - 1

    // Fetch user info on mount
    useEffect(() => {
        async function fetchUser() {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            let name = ""
            if (user?.user_metadata?.full_name) {
                name = user.user_metadata.full_name
            } else if (user?.email) {
                // Extract name from email
                name = user.email.split('@')[0]
                name = name.charAt(0).toUpperCase() + name.slice(1)
            }
            setUserName(name)
        }
        fetchUser()
    }, [])

    const handleNext = async () => {
        if (currentStep === 0) {
            setCurrentStep(1)
            return
        }

        let isStepValid = false
        
        if (currentStep === 1) {
            isStepValid = await trigger(['fullName', 'headline'])
        } else if (currentStep === 2) {
            isStepValid = await trigger(['skills'])
        } else if (currentStep === 3) {
            isStepValid = await trigger(['interests'])
        }
        if (isStepValid) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
        }
    }

    useEffect(() => {
        if (userName) {
            methods.setValue("fullName", userName, { shouldValidate: true })
        }
    }, [userName, methods])

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const onSubmit = async (data: OnboardingFormValues) => {
        setIsSubmitting(true)

        try {
            let completionPercentage = 25

            if (data.skills && data.skills.length > 0) {
                completionPercentage += 25
            }

            if (data.interests && data.interests.length > 0) {
                completionPercentage += 40
            }

            const hasExp = data.experiences && data.experiences.some(e => e.title || e.company)
            const hasLinks = data.links && data.links.some(l => l.url)
            if (hasExp || hasLinks) {
                completionPercentage += 10
            }

            const result = await completeOnboarding(data, completionPercentage)

            // Trigger embedding generation from the frontend
            if (result.success && result.userId) {
                fetch('/api/embeddings/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: result.userId })
                }).catch(err => console.error("Embedding generation failed to start:", err));
                
                toast.success("Profile setup complete! Your vector embedding is queued.");
                router.push("/dashboard");
                router.refresh();
            } else {
                // If there's an error and we didn't get a user ID, we need to handle it
                setIsSubmitting(false);
            }

        } catch (error: unknown) {
            console.error("Onboarding submission failed:", error)
            const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
            {/* Background - enhanced for full screen welcome */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            
            {/* Animated orbs - larger and more prominent for welcome screen */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl"
            />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-3xl relative z-10 p-4 sm:p-6 lg:p-8"
            >
                <GlassCard 
                    hoverable 
                    className="flex flex-col bg-black/40 sm:bg-black/50 shadow-2xl shadow-primary/5 border border-white/10"
                >
                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-border/20 flex flex-col items-center">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4"
                        >
                            <span className="text-primary-foreground font-bold text-2xl">C</span>
                        </motion.div>
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>

                    {/* Form */}
                    <div className="p-6 sm:p-8 md:px-12 flex-1">
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 flex flex-col">
                                <div className="flex-1">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={transition}
                                    >
                                        {currentStep === 0 ? (
                                            <StepWelcome onNext={handleNext} />
                                        ) : currentStep === 1 ? (
                                            <StepBasicInfo userName={userName} />
                                        ) : currentStep === 2 ? (
                                            <StepSkills />
                                        ) : currentStep === 3 ? (
                                            <StepInterestsAndGoals />
                                        ) : (
                                            <StepExperience />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            {currentStep > 0 && (
                                <div className="flex items-center justify-between pt-6 border-t border-border/20">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={currentStep <= 1 || isSubmitting}
                                        className={currentStep <= 1 ? "invisible" : ""}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>

                                    <Button
                                        type={isLastStep ? "submit" : "button"}
                                        onClick={!isLastStep ? handleNext : undefined}
                                        disabled={isSubmitting}
                                        className="min-w-[140px]"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : isLastStep ? (
                                            "Complete Profile"
                                        ) : (
                                            <>
                                                Next Step
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </FormProvider>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
