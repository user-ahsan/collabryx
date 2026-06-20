"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowRight, ArrowLeft, User, Code2, Target, Briefcase, Sparkles, AlertTriangle } from "lucide-react"

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
import { StepRoleSelect } from "@/components/features/onboarding/step-role-select"
import { StepBasicInfo } from "@/components/features/onboarding/step-basic-info"
import { StepSkills } from "@/components/features/onboarding/step-skills"
import { StepInterestsAndGoals } from "@/components/features/onboarding/step-interests-goals"
import { StepExperience } from "@/components/features/onboarding/step-experience"
import { GlassCard } from "@/components/shared/glass-card"
import { createClient } from "@/lib/supabase/client"
import { completeOnboarding } from "./actions"
import { useDebounce } from "@/hooks/use-debounce"
import { isEmailVerificationSkipped } from "@/lib/services/development"
import { onboardingDataSchemaObject, OnboardingData } from "@/lib/validations/onboarding"

const combinedSchema = onboardingDataSchemaObject


const STEPS = [
    { id: "welcome", title: "Welcome", component: StepWelcome, icon: Sparkles },
    { id: "role-select", title: "Your Role", component: StepRoleSelect, icon: Sparkles },
    { id: "basic-info", title: "Basic Info", component: StepBasicInfo, icon: User },
    { id: "skills", title: "Skills", component: StepSkills, icon: Code2 },
    { id: "interests-goals", title: "Interests & Goals", component: StepInterestsAndGoals, icon: Target },
    { id: "experience", title: "Experience", component: StepExperience, icon: Briefcase },
]

const transition = {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
}

/**
 * OnboardingPage - Multi-step profile setup flow orchestrator.
 *
 * UX ARCHITECTURE:
 * The onboarding flow has 5 steps: Welcome → Basic Info → Skills → Interests & Goals → Experience.
 * Step 0 (Welcome) is a transitional landing — no form data, just a CTA to begin.
 * Steps 1-4 progressively collect profile data with validation gates between them.
 * The Experience step is the only optional one (user can "Skip & Complete" from step 3).
 *
 * CRITICAL FIXES APPLIED:
 *
 * 1. ANIMATION DIRECTION (Data Loss UX Bug)
 *    PROBLEM: The motion `enter/exit` variants used a hardcoded x-offset of +20/-20 regardless
 *    of navigation direction. Going forward: new content slides in from right (correct).
 *    Going backward: new content ALSO slides in from right (WRONG — should slide in from left).
 *    This disorients the user — the brain expects spatial consistency where "back" means
 *    "return to where you came from" (left-to-right motion).
 *    SOLUTION: Added a `direction` state (1 | -1) set by `handleNext`/`handleBack`. The motion
 *    variants now use `custom={direction}` and the enter/exit offsets are `dir * 20` and
 *    `dir * -20` respectively. Forward: +20→0, exit 0→-20. Backward: -20→0, exit 0→+20.
 *
 * 2. SKIP & COMPLETE DATA LOSS BUG
 *    PROBLEM: "Skip & Complete" was shown on both step 3 (Interests) AND step 4 (Experience)
 *    because the condition was `currentStep >= 3`. On step 4, clicking it would call
 *    `handleSkipExperience` which submits with `experiences: []` and `links: []` —
 *    DESTROYING any data the user just filled in on the Experience step. This is a silent
 *    data loss bug with no confirmation dialog.
 *    SOLUTION: Changed condition to `currentStep === 3` so "Skip & Complete" only appears on
 *    the Interests step. On the Experience step, the user must use "Complete Profile" which
 *    preserves all entered data.
 *
 * 3. COMPLETION PERCENTAGE INCONSISTENCY
 *    PROBLEM: `handleSkipExperience` weighted interests at 40% while `onSubmit` weighted
 *    them at 15%. Goals were 0% in skip path but 10% in full path. This meant the loading
 *    dialog showed different progress for the same data depending on which button was clicked.
 *    SOLUTION: Unified both paths to use consistent weights: basic info 25%, skills 25%,
 *    interests 15%, goals 10%, experiences 15%, links 10%.
 *
 * 4. FOCUS MANAGEMENT
 *    PROBLEM: After every step transition (via AnimatePresence), focus was lost entirely.
 *    Keyboard users and screen reader users would have no indication of where they landed.
 *    SOLUTION: Added a `useEffect` on `currentStep` change that scrolls the form content
 *    to top and focuses the `#step-heading` element for screen reader announcement.
 *
 * 5. EMAIL WARNING PERSISTENCE
 *    PROBLEM: The "Continue Anyway" acknowledgment was in-memory only (`useState`). If the
 *    user accidentally refreshed the page, they'd see the warning again. SOLUTION: Persist
 *    to `localStorage` on acknowledgment and restore on mount. On session clear or
 *    verification completion the localStorage item is cleaned up naturally (since the
 *    `isEmailVerified` check is re-run on mount).
 *
 * 6. SCROLL TO FIRST ERROR
 *    PROBLEM: When validation failed on Basic Info, `toast.error` fired but the user had
 *    to manually find which field was invalid. SOLUTION: After `trigger()` fails,
 *    `querySelector('[aria-invalid="true"]')` finds the first errored field and
 *    `scrollIntoView({ behavior: 'smooth', block: 'center' })` brings it into focus.
 */
export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userName, setUserName] = useState("")
    const [completionPercentage, setCompletionPercentage] = useState(0)
    const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [direction, setDirection] = useState<1 | -1>(1) // 1=forward, -1=back
    const router = useRouter()
    const shouldReduceMotion = useReducedMotion()
    const recoveryShownRef = useRef(false)
    const mainContentRef = useRef<HTMLDivElement>(null)

    const methods = useForm<OnboardingData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(combinedSchema) as any,
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            fullName: "",
            displayName: "",
            headline: "",
            location: "",
            university: "",
            avatarUrl: "",
            bio: "",
            collaborationReadiness: "available",
            roles: [],
            skills: [],
            interests: [],
            goals: [],
            experiences: [],
            links: [],
            // Role-specific defaults
            major: "",
            project_interests: [],
            looking_for_team: false,
            stage_focus: [],
            sectors: [],
            portfolio_url: "",
            investment_history_count: 0,
            accredited_investor: false,
            company_name: "",
            company_role: "",
            hiring_needs: [],
            open_to_mentoring: false,
            mentoring_areas: [],
            mentoring_format: null,
            mentoring_availability_hours: null,
        }
    })

    const { handleSubmit, trigger, watch, formState: { isDirty } } = methods
    const isLastStep = currentStep === STEPS.length - 1
    
    // Track form changes for unsaved warning
    const formValues = watch()
    const debouncedValues = useDebounce(formValues, 800)

    
    // Detect form changes
    useEffect(() => {
        if (isDirty && currentStep > 0) {
            setHasUnsavedChanges(true)
        }
    }, [isDirty, currentStep])

    // Fetch user info on mount — with retry for transient failures
    useEffect(() => {
        let cancelled = false
        let retries = 0
        const MAX_RETRIES = 3

        async function fetchUser() {
            try {
                const supabase = createClient()
                const { data: { user }, error } = await supabase.auth.getUser()
                
                if (error) {
                    // Retry on transient failures before redirecting
                    if (retries < MAX_RETRIES) {
                        retries++
                        console.warn(`getUser failed (attempt ${retries}/${MAX_RETRIES}), retrying...`, error)
                        setTimeout(fetchUser, 1000 * retries) // exponential backoff
                        return
                    }
                    if (!cancelled) {
                        console.error("Failed to fetch user after retries:", error)
                        toast.error("Authentication failed. Please log in again.")
                        router.push("/login")
                    }
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
                // Respect SKIP_EMAIL_VERIFICATION env var — if set, treat as verified
                const emailIsVerified = isEmailVerificationSkipped() ? true : !!user?.email_confirmed_at
                setIsEmailVerified(emailIsVerified)
                
                if (!emailIsVerified) {
                    setHasAcknowledgedWarning(false)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Error fetching user:", error)
                    toast.error("Failed to load user information.")
                }
            }
        }
        fetchUser()
        return () => { cancelled = true }
    }, [router])
    
    // Focus management on step change - scroll to top of form content
    useEffect(() => {
        if (currentStep > 0) {
            const timer = setTimeout(() => {
                mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                const globalWindow = window as Window & {
                    lenis?: {
                        scrollTo: (target: number | string | HTMLElement, options?: { immediate?: boolean }) => void
                    }
                }
                if (globalWindow.lenis) {
                    globalWindow.lenis.scrollTo(0, { immediate: true })
                } else {
                    window.scrollTo(0, 0)
                }
                // Focus the step heading for screen readers
                const heading = document.getElementById('step-heading')
                if (heading) {
                    heading.focus({ preventScroll: true })
                }
            }, 150)
            return () => clearTimeout(timer)
        }
    }, [currentStep])

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
                    values: debouncedValues,
                    step: currentStep,
                    timestamp: Date.now()
                }))
            } catch (error) {
                console.warn("Failed to persist form data:", error)
            }
        }
    }, [debouncedValues, currentStep, hasUnsavedChanges])
    
    // Restore email verification acknowledgment from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("onboarding_email_warning_acknowledged")
            if (saved === "true") {
                setHasAcknowledgedWarning(true)
            }
        } catch {
            // localStorage not available
        }
    }, [])

    // Restore form data from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem("onboarding_draft")
            if (saved) {
                const parsed = JSON.parse(saved)
                const { values: rawValues, step, timestamp } = parsed
                const validated = onboardingDataSchemaObject.partial().safeParse(rawValues)
                if (!validated.success) {
                    sessionStorage.removeItem('onboarding_draft')
                    return
                }
                const values = validated.data
                // Only restore if saved within last 24 hours
                const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000
                if (isRecent && step > 0) {
                    methods.reset(values)
                    setHasUnsavedChanges(true)
                    setCurrentStep(step)
                    if (!recoveryShownRef.current) {
                        recoveryShownRef.current = true
                        toast.info("Draft recovered from previous session")
                    }
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
        if (isTransitioning || isSubmitting) return
        setIsTransitioning(true)
        setDirection(1)
        try {
            if (currentStep === 0) {
                setCurrentStep(1)
                return
            }

            // Only validate and move to next step for steps 1-4
            let isStepValid = false
            
            if (currentStep === 1) {
                // Validate role selection
                const roles = methods.getValues('roles')
                isStepValid = roles.length >= 1
                if (!isStepValid) {
                    toast.error("Please select at least one role")
                    return
                }

                // Logical compatibility check
                if (roles.includes('student')) {
                    const incompatible = roles.filter(r => r === 'professional' || r === 'mentor' || r === 'investor')
                    if (incompatible.length > 0) {
                        toast.error(`A student cannot also be a ${incompatible.join(', ')}`)
                        return
                    }
                }

                setCurrentStep(2)
                return
            } else if (currentStep === 2) {
                const fieldsToValidate = ['fullName', 'headline', 'displayName', 'location'] as const
                const userRoles = watch('roles') || []
                const isInvestor = userRoles.includes('investor')
                
                const validationFields = isInvestor 
                    ? [...fieldsToValidate, 'check_size_min', 'check_size_max']
                    : fieldsToValidate

                isStepValid = await trigger(validationFields as (keyof OnboardingData)[])

                if (isStepValid && isInvestor) {
                    const checkMin = watch('check_size_min')
                    const checkMax = watch('check_size_max')
                    if (checkMin !== undefined && checkMin !== null && checkMax !== undefined && checkMax !== null && !isNaN(checkMin) && !isNaN(checkMax)) {
                        if (checkMax <= checkMin) {
                            methods.setError('check_size_max', {
                                type: 'custom',
                                message: 'Maximum check size must be higher than the minimum check size'
                            })
                            isStepValid = false
                        }
                    }
                }

                if (!isStepValid) {
                    // Scroll to first error field after DOM updates
                    setTimeout(() => {
                        const firstError = document.querySelector('[aria-invalid="true"]')
                        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }, 50)
                    toast.error("Please fix the errors before continuing")
                    return
                }
            } else if (currentStep === 3) {
                isStepValid = await trigger(['skills'])
                if (!isStepValid) {
                    toast.error("Please add at least 5 skills with proficiency levels")
                    return
                }
            } else if (currentStep === 4) {
                isStepValid = await trigger(['interests'])
                if (!isStepValid) {
                    toast.error("Please add at least one interest")
                    return
                }
            }
            
            if (isStepValid) {
                setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
            }
        } finally {
            setIsTransitioning(false)
        }
    }

    useEffect(() => {
        if (userName) {
            const currentValue = methods.getValues("fullName")
            if (!currentValue || currentValue === "") {
                methods.setValue("fullName", userName, { shouldValidate: true, shouldDirty: false })
            }
        }
    }, [userName, methods])

    const handleBack = () => {
        if (isTransitioning || isSubmitting) return
        setDirection(-1)
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleSkipExperience = async () => {
        // Prevent double submission
        if (isSubmitting) return
        
        // Validate current step before skipping
        const isCurrentStepValid = currentStep === 4 ? await trigger(['interests']) : true
        if (!isCurrentStepValid) {
            toast.error("Please fix validation errors before continuing")
            return
        }
        
        // Validate at least one role selected
        const currentVals = methods.getValues()
        const userRoles = currentVals?.roles || []
        if (!userRoles || userRoles.length === 0) {
            toast.error("Please select at least one role before completing")
            setIsSubmitting(false)
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
            
            if (!values.skills || values.skills.length < 5) {
                toast.error("At least 5 skills with proficiency levels are required")
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
            
            if (values.skills && values.skills.length >= 5) {
                calculatedPercentage += 25
            }
            
            if (values.interests && values.interests.length > 0) {
                calculatedPercentage += 15
            }
            if (values.goals && values.goals.length > 0) {
                calculatedPercentage += 10
            }
            // No experience/links = stays at current percentage
            
            setCompletionPercentage(calculatedPercentage)
            
            const result = await completeOnboarding(
                {
                    ...values,
                    roles: values.roles || userRoles || [],
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
                    // Show distinct messages for embedding queued vs failed
                    if (result.embeddingQueued) {
                        toast.success("Profile setup complete! Your vector embedding is queued.");
                    } else if (result.embeddingError) {
                        toast.success("Profile setup complete!");
                        toast.warning(
                            "Embedding will be generated in background.",
                            {
                                description: "The AI analysis is queued and will complete shortly."
                            }
                        );
                    } else {
                        toast.success("Profile setup complete!");
                    }
                    router.push("/dashboard")
                }
            } else {
                toast.error(result.error || "Failed to complete onboarding. Please try again.")
            }
        } catch (error: unknown) {
            console.error("Onboarding skip failed:", error)
            
            // Handle specific error types with user-friendly messages
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase()
                
                // Authentication/session errors — don't auto-redirect, let user recover
                if (errorMessage.includes("authentication") || errorMessage.includes("session") || errorMessage.includes("unauthorized")) {
                    toast.error("Your session has expired. Please sign in again to continue.", {
                        description: "Your progress has been saved.",
                        action: { label: "Sign In", onClick: () => router.push("/login") },
                        duration: 10000
                    })
                    setIsSubmitting(false)
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

    const onSubmit = useCallback(async (data: OnboardingData) => {
        // Prevent double submission
        if (isSubmitting) return
        // Only allow submission from the last step (Experience)
        if (!isLastStep) {
            setIsSubmitting(false)
            return
        }
        
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
            
            if (!data.skills || data.skills.length < 5) {
                toast.error("At least 5 skills with proficiency levels are required")
                setIsSubmitting(false)
                return
            }
            
            if (!data.interests || data.interests.length === 0) {
                toast.error("At least one interest is required")
                setIsSubmitting(false)
                return
            }

            let calculatedPercentage = 25
            if (data.skills?.length) calculatedPercentage += 25
            if (data.interests?.length) calculatedPercentage += 15
            if (data.goals?.length) calculatedPercentage += 10
            if (data.experiences?.length) calculatedPercentage += 15
            if (data.links?.length) calculatedPercentage += 10

            setCompletionPercentage(Math.min(calculatedPercentage, 100))

            const result = await completeOnboarding(data, calculatedPercentage)

            // Embedding generation is handled server-side in completeOnboarding()
            // No need to trigger from frontend - server action already queues it in DB and calls API
            if (result.success && result.userId) {
                // Clear persisted draft on success
                sessionStorage.removeItem("onboarding_draft")
                setHasUnsavedChanges(false)
                
                if (result.alreadyCompleted) {
                    // Profile was already completed, just redirect
                    setIsSubmitting(false)
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
                    setIsSubmitting(false)
                    router.push("/dashboard");
                }
            } else {
                toast.error(result.error || "Failed to complete onboarding. Please try again.")
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
                    setIsSubmitting(false)
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
    }, [isSubmitting, isLastStep, router])

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
                        <div className="p-2 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-amber-500">Email Not Verified</p>
                            <p className="text-xs text-amber-500/80 mt-0.5">Please verify your email to unlock all features. You can continue with onboarding for now.</p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setHasAcknowledgedWarning(true)
                                        try { localStorage.setItem("onboarding_email_warning_acknowledged", "true") } catch {}
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
                                
                                <div ref={mainContentRef} className="overflow-y-auto">
                                <AnimatePresence mode="wait" initial={false} custom={direction}>
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
                                            key="step-role"
                                            custom={direction}
                                            variants={{
                                                enter: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * 20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * -20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepRoleSelect
                                                selectedRoles={methods.watch('roles') || []}
                                                onChange={(roles) => methods.setValue('roles', roles, { shouldDirty: true })}
                                            />
                                        </motion.div>
                                    ) : currentStep === 2 ? (
                                        <motion.div
                                            key="step1"
                                            custom={direction}
                                            variants={{
                                                enter: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * 20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * -20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepBasicInfo
                                                userName={userName}
                                                selectedRoles={methods.watch('roles') || []}
                                                onNameExtracted={(displayName) => {
                                                    const current = methods.getValues("displayName")
                                                    if (!current) {
                                                        methods.setValue("displayName", displayName, {
                                                            shouldValidate: false,
                                                            shouldDirty: false
                                                        })
                                                    }
                                                }}
                                            />
                                        </motion.div>
                                    ) : currentStep === 3 ? (
                                        <motion.div
                                            key="step2"
                                            custom={direction}
                                            variants={{
                                                enter: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * 20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * -20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepSkills />
                                        </motion.div>
                                    ) : currentStep === 4 ? (
                                        <motion.div
                                            key="step3"
                                            custom={direction}
                                            variants={{
                                                enter: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * 20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * -20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepInterestsAndGoals />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="step4"
                                            custom={direction}
                                            variants={{
                                                enter: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * 20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit: (dir: number) => ({ opacity: 0, x: shouldReduceMotion ? 0 : dir * -20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={shouldReduceMotion ? { duration: 0 } : transition}
                                        >
                                            <StepExperience />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                </div>

                                {/* Navigation */}
                                {currentStep > 0 && (
                                    <div className="flex items-center justify-between pt-6 border-t border-border/20" role="navigation" aria-label="Form navigation">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleBack}
                                            disabled={currentStep <= 1 || isSubmitting}
                                            className={currentStep <= 1 ? "invisible" : "visible"}
                                            aria-label="Go to previous step"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                                            Back
                                        </Button>

                                        <div className="flex gap-3">
                                            {/* Skip & Complete - Only on step 4 (interests, before experience), not on last step */}
                                            {currentStep === 4 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSkipExperience}
                                                disabled={isSubmitting}
                                                className="min-w-[120px] border-primary/20 text-primary hover:bg-primary/10"
                                                aria-label="Complete profile without experience details"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                                ) : (
                                                    "Skip & Complete"
                                                )}
                                            </Button>
                                            )}
                                            
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
                                                    disabled={isSubmitting || isTransitioning}
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
                            <DialogContent className="sm:max-w-md" role="dialog" aria-modal="true" aria-labelledby="onboarding-dialog-title" aria-describedby="onboarding-dialog-description">
                                <DialogHeader>
                                    <DialogTitle id="onboarding-dialog-title" className="flex items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
                                        Completing Your Profile
                                    </DialogTitle>
                                    <DialogDescription id="onboarding-dialog-description" className="pt-2">
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
