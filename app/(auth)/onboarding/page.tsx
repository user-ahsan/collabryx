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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
}

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userName, setUserName] = useState("")
    const [completionPercentage, setCompletionPercentage] = useState(0)
    const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null)
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
            
            // Check email verification status
            setIsEmailVerified(!!user?.email_confirmed_at)
        }
        fetchUser()
    }, [])

    const handleNext = async () => {
        if (currentStep === 0) {
            setCurrentStep(1)
            return
        }

        // Only validate and move to next step for steps 1-3
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

    const handleSkipExperience = async () => {
        setIsSubmitting(true)
        try {
            const values = methods.getValues()
            
            // Calculate completion based on data entered so far
            let calculatedPercentage = 25 // Base for basic info
            
            if (values.skills && values.skills.length > 0) {
                calculatedPercentage += 25
            }
            
            if (values.interests && values.interests.length > 0) {
                calculatedPercentage += 40
            }
            // No experience/links = stays at current percentage (65-90%)
            
            setCompletionPercentage(calculatedPercentage)
            
            const result = await completeOnboarding(
                {
                    ...values,
                    experiences: [],
                    links: []
                },
                calculatedPercentage
            )
            
            if (result.success && result.userId) {
                if (result.alreadyCompleted) {
                    router.push("/dashboard")
                } else {
                    toast.success("Profile setup complete! Your vector embedding is queued.")
                    router.push("/dashboard")
                }
            }
        } catch (error: unknown) {
            console.error("Onboarding skip failed:", error)
            const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmit = async (data: OnboardingFormValues) => {
        // Calculate completion percentage
        let calculatedPercentage = 25

        if (data.skills && data.skills.length > 0) {
            calculatedPercentage += 25
        }

        if (data.interests && data.interests.length > 0) {
            calculatedPercentage += 40
        }

        const hasExp = data.experiences && data.experiences.some(e => e.title || e.company)
        const hasLinks = data.links && data.links.some(l => l.url)
        if (hasExp || hasLinks) {
            calculatedPercentage += 10
        }

        setCompletionPercentage(calculatedPercentage)
        setIsSubmitting(true)

        try {
            const result = await completeOnboarding(data, calculatedPercentage)

            // Embedding generation is handled server-side in completeOnboarding()
            // No need to trigger from frontend - server action already queues it in DB and calls API
            if (result.success && result.userId) {
                if (result.alreadyCompleted) {
                    // Profile was already completed, just redirect
                    router.push("/dashboard");
                } else {
                    // Show success toast with embedding status
                    if (result.embeddingQueued) {
                        toast.success("Profile setup complete! Your vector embedding is queued.");
                    } else if (result.embeddingError) {
                        // Embedding API failed but DB queue is reliable
                        toast.warning(
                            "Profile setup complete! Embedding will be generated in background.",
                            {
                                description: "The AI analysis is queued and will complete shortly."
                            }
                        );
                    } else {
                        toast.success("Profile setup complete!");
                    }
                    router.push("/dashboard");
                }
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
            {/* Background */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-3xl relative z-10 p-4 sm:p-6 lg:p-8"
            >
                {/* Email Verification Warning */}
                {isEmailVerified === false && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <div className="p-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-500">Email Not Verified</p>
                            <p className="text-xs text-amber-500/80 mt-0.5">Please verify your email to unlock all features. You can continue with onboarding now.</p>
                        </div>
                    </div>
                )}
                
                <GlassCard 
                    hoverable 
                    className="flex flex-col bg-black/40 sm:bg-black/50 shadow-2xl shadow-primary/5 border border-white/10"
                >
                    {/* Header with Stepper - hidden on welcome step */}
                    {currentStep > 0 && (
                        <div className="p-6 sm:p-8 border-b border-border/20">
                            <Stepper steps={STEPS} currentStep={currentStep} />
                        </div>
                    )}

                    {/* Form Area */}
                    <div className="p-6 sm:p-8 md:px-12">
                        <FormProvider {...methods}>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                onKeyDown={(e) => {
                                    // Prevent Enter from submitting on non-final steps
                                    if (e.key === "Enter" && currentStep < STEPS.length - 1) {
                                        e.preventDefault()
                                    }
                                }}
                                className="space-y-8 flex flex-col"
                            >
                                <AnimatePresence mode="wait">
                                    {currentStep === 0 ? (
                                        <motion.div
                                            key="welcome"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <StepWelcome onNext={handleNext} />
                                        </motion.div>
                                    ) : currentStep === 1 ? (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={transition}
                                        >
                                            <StepBasicInfo userName={userName} />
                                        </motion.div>
                                    ) : currentStep === 2 ? (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={transition}
                                        >
                                            <StepSkills />
                                        </motion.div>
                                    ) : currentStep === 3 ? (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={transition}
                                        >
                                            <StepInterestsAndGoals />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={transition}
                                        >
                                            <StepExperience onSkip={handleSkipExperience} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

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

                                        <div className="flex gap-3">
                                            {/* Skip & Complete - Available on all steps */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSkipExperience}
                                                disabled={isSubmitting}
                                                className="min-w-[120px] border-primary/20 text-primary hover:bg-primary/10"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    "Skip & Complete"
                                                )}
                                            </Button>
                                            
                                            {isLastStep ? (
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="min-w-[140px]"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Completing...
                                                        </>
                                                    ) : (
                                                        "Complete Profile"
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    onClick={handleNext}
                                                    disabled={isSubmitting}
                                                    className="min-w-[140px]"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Next Step
                                                            <ArrowRight className="w-4 h-4 ml-2" />
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                            
                        {/* Loading Dialog */}
                        <Dialog open={isSubmitting}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        Completing Your Profile
                                    </DialogTitle>
                                    <DialogDescription className="pt-2">
                                        {completionPercentage === 90 
                                            ? "Setting up your profile with basic information..."
                                            : "Setting up your complete profile with all details..."
                                        }
                                        {" Your AI embedding is being generated."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Overall Progress</span>
                                            <span className="font-medium text-primary">{completionPercentage}%</span>
                                        </div>
                                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-700 ease-in-out" 
                                                style={{ width: `${completionPercentage}%` }} 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Checklist */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-muted-foreground">Profile information saved</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-muted-foreground">Skills & interests added</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className={isSubmitting ? "text-primary" : "text-muted-foreground"}>
                                                {isSubmitting ? "Generating AI embedding..." : "AI embedding generated"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        </FormProvider>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
