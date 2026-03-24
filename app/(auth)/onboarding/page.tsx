"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
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

// Schemas for each step - aligned with component validation
const basicInfoSchema = z.object({
    fullName: z.string()
        .min(2, "Full name must be at least 2 characters.")
        .max(100, "Full name must be less than 100 characters.")
        .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
    displayName: z.string()
        .max(30, "Display name must be less than 30 characters.")
        .regex(/^[a-z0-9_]*$/, "Display name can only contain lowercase letters, numbers, and underscores.")
        .optional()
        .or(z.literal("")),
    headline: z.string()
        .min(5, "Headline must be at least 5 characters.")
        .max(100, "Headline must be less than 100 characters.")
        .regex(/^[a-zA-Z0-9\s@.,&'()-]+$/, "Headline can only contain letters, numbers, and basic punctuation."),
    location: z.string()
        .max(100, "Location must be less than 100 characters.")
        .optional()
        .or(z.literal("")),
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
        title: z.string().optional().or(z.literal("")),
        company: z.string().optional().or(z.literal("")),
        description: z.string().optional().or(z.literal("")),
    }).refine(
        (data) => data.title || data.company,
        { message: "At least title or company is required" }
    )).optional(),
    links: z.array(z.object({
        platform: z.string(),
        url: z.string().optional().or(z.literal("")),
    })).optional(),
})

const combinedSchema = z.object({
    ...basicInfoSchema.shape,
    ...skillsSchema.shape,
    ...interestsGoalsSchema.shape,
    ...experienceSchema.shape,
});

export type OnboardingFormValues = z.infer<typeof combinedSchema>

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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false)
    const router = useRouter()
    const shouldReduceMotion = useReducedMotion()

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(combinedSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
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

    const { handleSubmit, trigger, watch, formState: { isDirty } } = methods
    const isLastStep = currentStep === STEPS.length - 1
    
    // Track form changes for unsaved warning
    const formValues = watch()
    
    // Detect form changes
    useEffect(() => {
        if (isDirty && currentStep > 0) {
            setHasUnsavedChanges(true)
        }
    }, [isDirty, currentStep])

    // Fetch user info on mount
    useEffect(() => {
        async function fetchUser() {
            try {
                const supabase = await createClient()
                const { data: { user }, error } = await supabase.auth.getUser()
                
                if (error) {
                    console.error("Failed to fetch user:", error)
                    toast.error("Authentication failed. Please log in again.")
                    router.push("/login")
                    return
                }
                
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
                const emailIsVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined
                setIsEmailVerified(emailIsVerified)
                
                if (!emailIsVerified) {
                    setHasAcknowledgedWarning(false)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
                toast.error("Failed to load user information.")
            }
        }
        fetchUser()
    }, [router])
    
    // Warn before leaving page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !isSubmitting) {
                e.preventDefault()
                e.returnValue = ""
                return ""
            }
        }
        
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [hasUnsavedChanges, isSubmitting])
    
    // Persist form data to sessionStorage on change
    useEffect(() => {
        if (currentStep > 0 && hasUnsavedChanges) {
            try {
                sessionStorage.setItem("onboarding_draft", JSON.stringify({
                    values: formValues,
                    step: currentStep,
                    timestamp: Date.now()
                }))
            } catch (error) {
                console.warn("Failed to persist form data:", error)
            }
        }
    }, [formValues, currentStep, hasUnsavedChanges])
    
    // Restore form data from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem("onboarding_draft")
            if (saved) {
                const { values, step, timestamp } = JSON.parse(saved)
                // Only restore if saved within last 24 hours
                const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000
                if (isRecent && step > 0) {
                    methods.reset(values)
                    setCurrentStep(step)
                    toast.info("Draft recovered from previous session")
                } else {
                    sessionStorage.removeItem("onboarding_draft")
                }
            }
        } catch (error) {
            console.warn("Failed to restore form data:", error)
            sessionStorage.removeItem("onboarding_draft")
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleNext = async () => {
        if (currentStep === 0) {
            setCurrentStep(1)
            return
        }

        // Prevent navigation during submission
        if (isSubmitting) return

        // Only validate and move to next step for steps 1-3
        let isStepValid = false
        
        if (currentStep === 1) {
            isStepValid = await trigger(['fullName', 'headline', 'displayName', 'location'])
            if (!isStepValid) {
                toast.error("Please fix the errors before continuing")
                return
            }
        } else if (currentStep === 2) {
            isStepValid = await trigger(['skills'])
            if (!isStepValid) {
                toast.error("Please add at least one skill")
                return
            }
        } else if (currentStep === 3) {
            isStepValid = await trigger(['interests'])
            if (!isStepValid) {
                toast.error("Please add at least one interest")
                return
            }
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
        // Prevent double submission
        if (isSubmitting) return
        
        // Validate current step before skipping
        const isCurrentStepValid = currentStep === 3 ? await trigger(['interests']) : true
        if (!isCurrentStepValid) {
            toast.error("Please fix validation errors before continuing")
            return
        }
        
        setIsSubmitting(true)
        
        try {
            const values = methods.getValues()
            
            // Client-side validation before submission
            if (!values.fullName || values.fullName.trim().length < 2) {
                toast.error("Full name is required")
                setIsSubmitting(false)
                return
            }
            
            if (!values.headline || values.headline.trim().length < 5) {
                toast.error("Headline is required (minimum 5 characters)")
                setIsSubmitting(false)
                return
            }
            
            if (!values.skills || values.skills.length === 0) {
                toast.error("At least one skill is required")
                setIsSubmitting(false)
                return
            }
            
            if (!values.interests || values.interests.length === 0) {
                toast.error("At least one interest is required")
                setIsSubmitting(false)
                return
            }
            
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
                // Clear persisted draft on success
                sessionStorage.removeItem("onboarding_draft")
                setHasUnsavedChanges(false)
                
                if (result.alreadyCompleted) {
                    router.push("/dashboard")
                } else {
                    toast.success("Profile setup complete! Your vector embedding is queued.")
                    router.push("/dashboard")
                }
            } else {
                toast.error("Failed to complete onboarding. Please try again.")
            }
        } catch (error: unknown) {
            console.error("Onboarding skip failed:", error)
            
            // Handle specific error types with user-friendly messages
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase()
                
                // Authentication/session errors
                if (errorMessage.includes("authentication") || errorMessage.includes("session") || errorMessage.includes("unauthorized")) {
                    toast.error("Your session has expired. Please log in again.")
                    router.push("/login")
                    return
                }
                
                // Network errors - allow retry
                if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
                    toast.error("Network error. Please check your connection and try again.", {
                        description: "Your data is saved locally and can be recovered.",
                        duration: 8000
                    })
                    setIsSubmitting(false)
                    return
                }
                
                // Generic error with message
                toast.error(error.message || "Failed to complete onboarding. Please try again.")
            } else {
                toast.error("An unexpected error occurred. Please try again.", {
                    description: "If the problem persists, contact support.",
                    duration: 8000
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmit = useCallback(async (data: OnboardingFormValues) => {
        // Prevent double submission
        if (isSubmitting) return
        
        setIsSubmitting(true)

        try {
            // Client-side validation before submission (redundant but safe)
            if (!data.fullName || data.fullName.trim().length < 2) {
                toast.error("Full name is required (minimum 2 characters)")
                setIsSubmitting(false)
                return
            }
            
            if (!data.headline || data.headline.trim().length < 5) {
                toast.error("Headline is required (minimum 5 characters)")
                setIsSubmitting(false)
                return
            }
            
            if (!data.skills || data.skills.length === 0) {
                toast.error("At least one skill is required")
                setIsSubmitting(false)
                return
            }
            
            if (!data.interests || data.interests.length === 0) {
                toast.error("At least one interest is required")
                setIsSubmitting(false)
                return
            }

            // Use backend calculation for consistency (matches database function)
            // Backend calculates: basic (25) + skills (25) + interests (15) + looking_for (10) + experience (25) = 100
            const calculatedPercentage = 25 // Base for basic info - backend will recalculate via trigger

            setCompletionPercentage(Math.min(calculatedPercentage + 75, 100)) // Estimate for UI

            const result = await completeOnboarding(data, calculatedPercentage)

            // Embedding generation is handled server-side in completeOnboarding()
            // No need to trigger from frontend - server action already queues it in DB and calls API
            if (result.success && result.userId) {
                // Clear persisted draft on success
                sessionStorage.removeItem("onboarding_draft")
                setHasUnsavedChanges(false)
                
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
                toast.error("Failed to complete onboarding. Please try again.")
                setIsSubmitting(false)
            }

        } catch (error: unknown) {
            console.error("Onboarding submission failed:", error)
            
            // Handle specific error types with user-friendly messages
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase()
                
                // Authentication/session errors
                if (errorMessage.includes("authentication") || errorMessage.includes("session") || errorMessage.includes("unauthorized")) {
                    toast.error("Your session has expired. Please log in again.")
                    router.push("/login")
                    return
                }
                
                // Network errors - allow retry
                if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
                    toast.error("Network error. Please check your connection and try again.", {
                        description: "Your data is saved locally and can be recovered.",
                        duration: 8000
                    })
                    setIsSubmitting(false)
                    return
                }
                
                // Database configuration errors
                if (errorMessage.includes("database") || errorMessage.includes("table") || errorMessage.includes("migration")) {
                    toast.error("Database configuration error. Please contact support.")
                    setIsSubmitting(false)
                    return
                }
                
                // Validation errors from server
                if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
                    toast.error("Please review your information and try again.")
                    setIsSubmitting(false)
                    return
                }
                
                // Generic error with message
                toast.error(error.message || "Failed to complete onboarding. Please try again.")
            } else {
                toast.error("An unexpected error occurred. Please try again.", {
                    description: "If the problem persists, contact support.",
                    duration: 8000
                })
            }
            setIsSubmitting(false)
        }
    }, [isSubmitting, router])

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
            {/* Skip link for keyboard users */}
            <a 
                href="#onboarding-main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
            >
                Skip to main content
            </a>
            
            {/* Background */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" aria-hidden="true" />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
                className="w-full max-w-3xl relative z-10 p-4 sm:p-6 lg:p-8"
            >
                {/* Email Verification Warning */}
                {isEmailVerified === false && !hasAcknowledgedWarning && (
                    <div 
                        className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3" 
                        role="alert"
                        aria-live="polite"
                    >
                        <div className="p-2 rounded-full bg-amber-500/20 flex items-center justify-center" aria-hidden="true">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-500">Email Not Verified</p>
                            <p className="text-xs text-amber-500/80 mt-0.5">Please verify your email to unlock all features. You can continue with onboarding now.</p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setHasAcknowledgedWarning(true)
                                        toast.info("You can verify your email from your account settings")
                                    }}
                                    className="h-8 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                >
                                    Continue Anyway
                                </Button>
                            </div>
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
                                aria-label="Onboarding form"
                            >
                                {/* Live region for step changes and announcements */}
                                <div 
                                    id="onboarding-main-content"
                                    className="sr-only" 
                                    aria-live="polite" 
                                    aria-atomic="true"
                                >
                                    {currentStep > 0 && `Step ${currentStep} of ${STEPS.length - 1}: ${STEPS[currentStep]?.title}`}
                                </div>
                                
                                <AnimatePresence mode="wait" initial={false}>
                                    {currentStep === 0 ? (
                                        <motion.div
                                            key="welcome"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                                        >
                                            <StepWelcome onNext={handleNext} />
                                        </motion.div>
                                    ) : currentStep === 1 ? (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepBasicInfo userName={userName} />
                                        </motion.div>
                                    ) : currentStep === 2 ? (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepSkills />
                                        </motion.div>
                                    ) : currentStep === 3 ? (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepInterestsAndGoals />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepExperience onSkip={handleSkipExperience} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation */}
                                {currentStep > 0 && (
                                    <div className="flex items-center justify-between pt-6 border-t border-border/20" role="navigation" aria-label="Form navigation">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleBack}
                                            disabled={currentStep <= 1 || isSubmitting}
                                            className={currentStep <= 1 ? "invisible" : ""}
                                            aria-label="Go to previous step"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
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
                                                aria-label="Skip experience step and complete profile"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
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
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
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
                                                    aria-label="Go to next step"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                                    ) : (
                                                        <>
                                                            Next Step
                                                            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
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
                            <DialogContent className="sm:max-w-md" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">
                                <DialogHeader>
                                    <DialogTitle id="dialog-title" className="flex items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
                                        Completing Your Profile
                                    </DialogTitle>
                                    <DialogDescription id="dialog-description" className="pt-2">
                                        {completionPercentage === 90 
                                            ? "Setting up your profile with basic information..."
                                            : "Setting up your complete profile with all details..."
                                        }
                                        {" Your AI embedding is being generated."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4" role="status" aria-live="polite">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground" id="progress-label">Overall Progress</span>
                                            <span className="font-medium text-primary" aria-live="polite">{completionPercentage}%</span>
                                        </div>
                                        <div 
                                            className="h-3 bg-secondary rounded-full overflow-hidden"
                                            role="progressbar"
                                            aria-valuenow={completionPercentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-labelledby="progress-label"
                                        >
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
