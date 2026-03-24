"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Loader2, Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { useRouter } from "next/navigation"
import { devLog, logEmailVerificationStatus, logRedirectDecision, isDebugEnabled, isDevelopmentMode } from "@/lib/services/development"

// ARIA live region announcer component for screen readers
function LiveAnnouncer({ message, priority = "polite" }: { message: string; priority?: "polite" | "assertive" }) {
    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    )
}

type VerificationStatus = "loading" | "verified" | "error" | "pending"

export function VerifyEmailForm() {
    const [status, setStatus] = React.useState<VerificationStatus>("loading")
    const [isResending, setIsResending] = React.useState(false)
    const [message, setMessage] = React.useState<string>("")
    const [userEmail, setUserEmail] = React.useState<string>("")
    const supabase = createClient()
    const router = useRouter()

    React.useEffect(() => {
        const checkEmailVerification = async () => {
            const stopTimer = performance.now()
            devLog("auth", "=== EMAIL VERIFICATION CHECK STARTED ===", {
                isDevelopmentMode: isDevelopmentMode(),
                debugEnabled: isDebugEnabled(),
            })
            
            try {
                devLog("auth", "Fetching current user")
                
                const { data: { user }, error } = await supabase.auth.getUser()

                if (error) {
                    devLog("auth", "❌ Email verification failed - getUser error", {
                        errorCode: error.code,
                        errorMessage: error.message,
                    })
                    setStatus("error")
                    setMessage("Invalid or expired verification link. Please request a new verification email.")
                    return
                }

                if (user) {
                    setUserEmail(user.email || "")

                    // Log email verification status with detailed info
                    logEmailVerificationStatus(user.email, user.email_confirmed_at, "verify-email-form")
                    
                    // CRITICAL: Only redirect if email_confirmed_at is actually set (truthy)
                    const isEmailConfirmed = !!user.email_confirmed_at
                    
                    devLog("auth", "Email verification status evaluation", {
                        email: user.email,
                        emailConfirmedAt: user.email_confirmed_at,
                        isEmailConfirmed,
                        willRedirect: isEmailConfirmed,
                    })

                    // Check if email is verified - MUST be truthy, not just exist
                    if (isEmailConfirmed) {
                        devLog("auth", "✅ Email is CONFIRMED - scheduling redirect", {
                            email: user.email,
                            confirmedAt: user.email_confirmed_at,
                            redirectDelay: 2000,
                            destination: "/onboarding",
                        })
                        setStatus("verified")

                        // Redirect to onboarding or dashboard after 2 second delay
                        setTimeout(() => {
                            logRedirectDecision("/verify-email", "/onboarding", "Email verification successful")
                            devLog("auth", "🚀 Executing redirect to /onboarding")
                            router.push("/onboarding")
                        }, 2000)
                    } else {
                        devLog("auth", "⚠️ Email is NOT confirmed - showing pending state", {
                            email: user.email,
                            emailConfirmedAt: user.email_confirmed_at,
                            isConfirmed: isEmailConfirmed,
                        })
                        setStatus("pending")
                        setMessage("Your email is not yet verified. Please check your inbox.")
                    }
                }
                
                // Log performance
                const duration = performance.now() - stopTimer
                if (isDebugEnabled()) {
                    devLog("perf", "⏱️ Email verification check completed", { durationMs: duration.toFixed(2) })
                }
            } catch {
                console.error("Email verification error:", err)
                devLog("auth", "❌ Email verification error - unexpected exception", {
                    error: err instanceof Error ? err.message : "Unknown error",
                })
                setStatus("error")
                setMessage("An unexpected error occurred. Please try again.")
            }
        }

        checkEmailVerification()
    }, [supabase.auth, router])

    const handleResendEmail = async () => {
        devLog("auth", "Resending verification email", { email: userEmail })
        setIsResending(true)

        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: userEmail,
            })

            if (error) {
                devLog("auth", "Resend email failed", {
                    email: userEmail,
                    errorCode: error.code,
                    errorMessage: error.message,
                })
                setMessage(error.message)
            } else {
                devLog("auth", "Verification email resent successfully", { email: userEmail })
                setMessage("Verification email resent! Please check your inbox.")
            }
        } catch {
            console.error("Resend email error:", err)
            devLog("auth", "Resend email error - unexpected exception", {
                email: userEmail,
                error: err instanceof Error ? err.message : "Unknown error",
            })
            setMessage("Failed to resend verification email. Please try again.")
        } finally {
            setIsResending(false)
        }
    }

    const buttonClasses = cn(
        "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl",
        glass("buttonPrimary")
    )

    return (
        <div className="w-full relative min-h-[350px] sm:min-h-[400px]" role="main" aria-label="Email verification">
            {/* Live region for status announcements */}
            <LiveAnnouncer 
                message={
                    status === "loading" ? "Verifying your email, please wait" :
                    status === "verified" ? "Email verified successfully. Redirecting to onboarding." :
                    status === "error" ? "Verification failed. " + message :
                    status === "pending" ? "Email not yet verified. Please check your inbox." : ""
                }
                priority={status === "error" ? "assertive" : "polite"}
            />
            
            {/* DEV MODE Indicator - improved contrast and accessibility */}
            {isDevelopmentMode() && isDebugEnabled() && (
                <div className="absolute top-2 right-2 z-50">
                    <div 
                        className="px-2 py-1 text-xs font-semibold bg-amber-600 text-white rounded-md shadow-lg"
                        role="status"
                        aria-label="Development mode indicator"
                    >
                        DEV MODE
                    </div>
                </div>
            )}
            
            <div className="relative z-10 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    {status === "loading" && (
                        <div 
                            className="flex flex-col items-center justify-center py-12 space-y-4"
                            role="status"
                            aria-busy="true"
                        >
                            <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
                            <p className="text-muted-foreground" id="loading-message">Verifying your email...</p>
                        </div>
                    )}

                    {status === "verified" && (
                        <div className="text-left space-y-6" role="region" aria-labelledby="verified-heading">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 id="verified-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Email verified!</h1>
                                <p className="text-muted-foreground text-base sm:text-lg">
                                    Your email has been successfully verified
                                </p>
                            </div>

                            <Alert className={cn(glass("subtle"))} role="status">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                                <AlertDescription className="text-green-600 dark:text-green-400">
                                    Redirecting you to onboarding...
                                </AlertDescription>
                            </Alert>

                            <Button asChild className={buttonClasses}>
                                <Link href="/onboarding">Continue to Onboarding</Link>
                            </Button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="text-left space-y-6" role="region" aria-labelledby="error-heading">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
                                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 id="error-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Verification failed</h1>
                                <p className="text-muted-foreground text-base sm:text-lg">
                                    We couldn&apos;t verify your email
                                </p>
                            </div>

                            <Alert variant="destructive" className={cn(glass("overlay"))} role="alert">
                                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleResendEmail}
                                    className={buttonClasses}
                                    disabled={isResending}
                                >
                                    {isResending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Resend Verification Email
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="link"
                                    className="w-full text-muted-foreground"
                                    asChild
                                >
                                    <Link href="/login">Back to Login</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === "pending" && (
                        <div className="text-left space-y-6" role="region" aria-labelledby="pending-heading">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20">
                                    <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 id="pending-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Verify your email</h1>
                                <p className="text-muted-foreground text-base sm:text-lg">
                                    We&apos;ve sent a verification link to your email
                                </p>
                            </div>

                            <Alert className={cn(glass("subtle"))} role="status">
                                <Mail className="h-5 w-5" aria-hidden="true" />
                                <AlertDescription>
                                    We&apos;ve sent a verification link to{" "}
                                    <span className="font-medium text-foreground">{userEmail}</span>.
                                    Please check your inbox and click the link to verify your email address.
                                </AlertDescription>
                            </Alert>

                            {message && (
                                <Alert className={cn(glass("subtle"))} role="status">
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            {/* DEV MODE: Debug Info Panel - keyboard accessible */}
                            {isDevelopmentMode() && isDebugEnabled() && (
                                <Alert 
                                    className={cn(glass("overlay"), "border-amber-500/30")}
                                    role="region"
                                    aria-labelledby="debug-info-heading"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                            <span id="debug-info-heading">Debug Info (Dev Mode)</span>
                                        </div>
                                        <div className="text-xs space-y-1 font-mono" role="list">
                                            <div className="flex justify-between" role="listitem">
                                                <span className="text-muted-foreground">Email:</span>
                                                <span className="text-foreground">{userEmail || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between" role="listitem">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span className="text-amber-600 dark:text-amber-400">PENDING</span>
                                            </div>
                                            <div className="flex justify-between" role="listitem">
                                                <span className="text-muted-foreground">Confirmed:</span>
                                                <span className="text-red-600">NO</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-xs text-muted-foreground">
                                            💡 Check console for detailed logs (prefix: [DEV:AUTH])
                                        </div>
                                    </div>
                                </Alert>
                            )}

                            <div className="space-y-3">
                                <Button
                                    onClick={handleResendEmail}
                                    className={buttonClasses}
                                    disabled={isResending}
                                >
                                    {isResending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Resend Verification Email
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="link"
                                    className="w-full text-muted-foreground"
                                    asChild
                                >
                                    <Link href="/login">Back to Login</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
