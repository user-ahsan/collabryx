"use client"

import React, { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowRight, ArrowLeft, User, Code2, Target, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/features/onboarding/stepper"
import { StepBasicInfo } from "@/components/features/onboarding/step-basic-info"
import { StepSkills } from "@/components/features/onboarding/step-skills"
import { StepInterestsAndGoals } from "@/components/features/onboarding/step-interests-goals"
import { StepExperience } from "@/components/features/onboarding/step-experience"
import { GlassCard } from "@/components/shared/glass-card"
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
        url: z.union([z.string().url("Must be a valid URL"), z.literal("")]),
    })).optional(),
})

// Combined Schema
const onboardingSchema = z.object({}).merge(basicInfoSchema).merge(skillsSchema).merge(interestsGoalsSchema).merge(experienceSchema)

type OnboardingFormValues = z.infer<typeof onboardingSchema>

const STEPS = [
    { id: "basic-info", title: "Basic Info", component: StepBasicInfo, schema: basicInfoSchema, icon: User },
    { id: "skills", title: "Skills", component: StepSkills, schema: skillsSchema, icon: Code2 },
    { id: "interests-goals", title: "Interests & Goals", component: StepInterestsAndGoals, schema: interestsGoalsSchema, icon: Target },
    { id: "experience", title: "Experience", component: StepExperience, schema: experienceSchema, icon: Briefcase },
]

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(STEPS[currentStep].schema as z.ZodType<any, any, any>),
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

    const { handleSubmit, trigger, formState: { isValid } } = methods
    const isLastStep = currentStep === STEPS.length - 1

    const handleNext = async () => {
        const isStepValid = await trigger()
        if (isStepValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
        }
    }

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0))
    }

    const onSubmit = async (data: OnboardingFormValues) => {
        if (!isLastStep) {
            handleNext()
            return
        }

        setIsSubmitting(true)

        try {
            // Calculate Profile Completion
            let filledFields = 0
            const totalFields = 6 // FullName, Headline, Location, Skills, Interests, Exp/Links

            if (data.fullName) filledFields++
            if (data.headline) filledFields++
            if (data.location) filledFields++
            if (data.skills && data.skills.length > 0) filledFields++
            if (data.interests && data.interests.length > 0) filledFields++

            const hasExp = data.experiences && data.experiences.some(e => e.title || e.company)
            const hasLinks = data.links && data.links.some(l => l.url)
            if (hasExp || hasLinks) filledFields++

            const completionPercentage = Math.round((filledFields / totalFields) * 100)

            if (process.env.NODE_ENV === "development") {
                const devProfileData = {
                    full_name: data.fullName,
                    display_name: data.displayName || null,
                    headline: data.headline,
                    location: data.location || null,
                    website_url: data.links && data.links.length > 0 ? JSON.stringify(data.links) : null,
                    looking_for: data.goals || [],
                    onboarding_completed: true,
                    profile_completion: completionPercentage,
                    skills: data.skills || [],
                    interests: data.interests || [],
                    experiences: data.experiences || []
                }
                localStorage.setItem("collabryx_dev_profile", JSON.stringify(devProfileData))
                document.cookie = "collabryx_dev_profile_completed=true; path=/";
                toast.success("Profile setup complete! (Saved locally in Dev Mode)")
                router.push("/dashboard")
                router.refresh()
                setIsSubmitting(false)
                return
            }

            await completeOnboarding(data, completionPercentage)

            toast.success("Profile setup complete!")
            router.push("/dashboard")
            router.refresh()

        } catch (error: any) {
            console.error("Onboarding submission failed:", error)
            toast.error(error?.message || "Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const CurrentStepComponent = STEPS[currentStep].component

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent rounded-full opacity-60 pointer-events-none transition-opacity duration-700" />

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl relative z-10"
            >
                <GlassCard hoverable className="flex flex-col bg-black/40 sm:bg-black/50">

                    {/* Header / Logo */}
                    <div className="p-6 sm:p-8 border-b border-border/20 flex flex-col items-center">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                            <span className="text-primary-foreground font-bold text-2xl">C</span>
                        </div>
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>

                    {/* Form Area */}
                    <div className="p-6 sm:p-8 md:px-12">
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 flex flex-col min-h-[320px]">

                                <div className="flex-1 overflow-visible">
                                    <AnimatePresence mode="wait" custom={currentStep}>
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <CurrentStepComponent />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Navigation Actions */}
                                <div className="flex items-center justify-between pt-6 border-t border-border/20">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={currentStep === 0 || isSubmitting}
                                        className={currentStep === 0 ? "invisible" : ""}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="min-w-[120px]"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : isLastStep ? (
                                            "Complete Profile"
                                        ) : (
                                            "Next Step"
                                        )}
                                        {!isSubmitting && !isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                                    </Button>
                                </div>
                            </form>
                        </FormProvider>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
