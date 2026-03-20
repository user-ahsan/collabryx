"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleIcon, GitHubIcon, AppleIcon } from "@/components/ui/social-icons"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { isDevelopmentMode, getDevelopmentCredentials } from "@/lib/services/development"

import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

// Live announcer for screen reader announcements
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

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
})

export function LoginForm() {
    // 🔴 CRITICAL DEBUG: Persistent logging that survives reload
    const debugId = React.useMemo(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const existingId = sessionStorage.getItem('login_form_debug_id')
            const newId = urlParams.get('debug') || existingId || Date.now().toString()
            sessionStorage.setItem('login_form_debug_id', newId)
            console.error(`🔴🔴🔴 [LOGIN_FORM_MOUNT] Component MOUNTED, debugId=${newId}, timestamp=${new Date().toISOString()} 🔴🔴🔴`)
            console.error(`🔴 [LOGIN_FORM_MOUNT] URL: ${window.location.href}`)
            console.error(`🔴 [LOGIN_FORM_MOUNT] User agent: ${navigator.userAgent}`)
            return newId
        }
        return 'server'
    }, [])

    const [isLoading, setIsLoading] = React.useState(false)
    const [showProviderDialog, setShowProviderDialog] = React.useState(false)
    const [providerToShow, setProviderToShow] = React.useState<"google" | "github" | "apple" | null>(null)
    const [isDev, setIsDev] = React.useState(false)
    const [devCredentials, setDevCredentials] = React.useState({ email: "", password: "" })
    const [announcement, setAnnouncement] = React.useState("")
    const supabase = createClient()

    // 🔴 CRITICAL DEBUG: Log every render
    console.error(`🔴 [LOGIN_FORM_RENDER] Component rendering, debugId=${debugId}, isLoading=${isLoading}`)

    // Pre-populate test credentials in development mode (client-side only)
    React.useEffect(() => {
        const dev = isDevelopmentMode()
        setIsDev(dev)
        if (dev) {
            setDevCredentials(getDevelopmentCredentials())
        }
    }, [])

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { 
            email: "", 
            password: "" 
        },
    })
    
    // 🔴 CRITICAL DEBUG: Track component lifecycle
    React.useEffect(() => {
        console.error(`🔴 [USE_EFFECT_MOUNT] Component mounted, debugId=${debugId}`)
        
        // Log before unload (will show if page is reloading)
        const beforeUnload = () => {
            console.error(`🔴🔴🔴 [BEFORE_UNLOAD] Page is about to unload/reload! debugId=${debugId} 🔴🔴🔴`)
            sessionStorage.setItem('login_last_event', 'before_unload')
        }
        
        window.addEventListener('beforeunload', beforeUnload)
        
        return () => {
            console.error(`🔴 [USE_EFFECT_CLEANUP] Component unmounting, debugId=${debugId}`)
            sessionStorage.setItem('login_last_event', 'unmount')
            window.removeEventListener('beforeunload', beforeUnload)
        }
    }, [debugId])

    // Announce form errors to screen readers
    React.useEffect(() => {
        const hasErrors = Object.keys(form.formState.errors).length > 0
        if (hasErrors) {
            setAnnouncement("Form has validation errors. Please check the fields and try again.")
        }
    }, [form.formState.errors])

    // Set values after mount to avoid hydration mismatch
    React.useEffect(() => {
        if (isDev && devCredentials.email) {
            form.setValue("email", devCredentials.email)
            form.setValue("password", devCredentials.password)
        }
    }, [isDev, devCredentials, form])

    const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
        // 🔴 CRITICAL DEBUG: This is the inner submit handler
        console.error(`🔴🔴🔴 [ON_LOGIN_SUBMIT] CALLED! debugId=${debugId}, email=${data.email} 🔴🔴🔴`)
        console.error(`🔴 [ON_LOGIN_SUBMIT] Timestamp: ${new Date().toISOString()}`)
        
        setIsLoading(true)
        
        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            console.error(`🔴 [ON_LOGIN_SUBMIT] Supabase not configured, redirecting in 2s`)
            toast.error("Authentication service is not configured. Please contact support.")
            setIsLoading(false)
            // Redirect to home page with error
            setTimeout(() => {
                console.error(`🔴 [ON_LOGIN_SUBMIT] Executing window.location.assign("/")`)
                window.location.assign("/")
            }, 2000)
            return
        }
        
        try {
            console.error(`🔴 [ON_LOGIN_SUBMIT] Calling supabase.auth.signInWithPassword...`)
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })
            console.error(`🔴 [ON_LOGIN_SUBMIT] Supabase call completed, error=${error?.message || 'none'}`)
            setIsLoading(false)

            if (error) {
                console.error(`🔴 [ON_LOGIN_SUBMIT] Login error: ${error.message}`)
                toast.error(error.message)
                return
            }

            console.error(`🔴 [ON_LOGIN_SUBMIT] Login SUCCESSFUL, calling window.location.assign("/auth-sync")`)
            toast.success("Welcome back!")
            window.location.assign("/auth-sync")
        } catch (err) {
            console.error(`🔴 [ON_LOGIN_SUBMIT] Login exception:`, err)
            toast.error("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    // 🔴 CRITICAL DEBUG: Wrapper handler to ensure preventDefault is called
    const handleSubmit = async (e: React.FormEvent) => {
        // 🔴 LOG BEFORE preventDefault to see if this is even being called
        console.error(`🔴🔴🔴 [HANDLE_SUBMIT] FORM SUBMIT TRIGGERED! debugId=${debugId} 🔴🔴🔴`)
        console.error(`🔴 [HANDLE_SUBMIT] Event type: ${e.type}, cancelable: ${e.cancelable}`)
        console.error(`🔴 [HANDLE_SUBMIT] Calling e.preventDefault() NOW...`)
        
        e.preventDefault()
        e.stopPropagation()
        
        console.error(`🔴 [HANDLE_SUBMIT] preventDefault() and stopPropagation() called`)
        console.error(`🔴 [HANDLE_SUBMIT] Event defaultPrevented: ${e.defaultPrevented}`)
        
        // 🔴 Check if form has action attribute (this would cause reload)
        const formElement = (e.target as HTMLFormElement)
        console.error(`🔴 [HANDLE_SUBMIT] Form action attribute: "${formElement.getAttribute('action') || 'none'}"`)
        console.error(`🔴 [HANDLE_SUBMIT] Form method: "${formElement.method || 'none'}"`)
        
        // 🔴 Trigger react-hook-form validation and submission
        console.error(`🔴 [HANDLE_SUBMIT] Calling form.handleSubmit(onLoginSubmit)...`)
        
        // 🔴 IMPORTANT: Don't pass event to form.handleSubmit - it creates its own
        await form.handleSubmit(onLoginSubmit)()
        
        console.error(`🔴 [HANDLE_SUBMIT] form.handleSubmit completed`)
    }

    const handleSocialLogin = async (provider: "google" | "github" | "apple") => {
        console.error(`🔴 [SOCIAL_LOGIN] Button clicked, provider=${provider}, debugId=${debugId}`)
        setProviderToShow(provider)
        setShowProviderDialog(true)
    }

    const handleProviderDialogClose = () => {
        setShowProviderDialog(false)
        setProviderToShow(null)
    }

    const inputClasses = cn(
        "pl-10 h-12 transition-all rounded-xl",
        glass("input")
    )
    const buttonClasses = cn(
        "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl",
        glass("buttonPrimary")
    )

    const getProviderName = (provider: "google" | "github" | "apple") => {
        switch (provider) {
            case "google": return "Google"
            case "github": return "GitHub"
            case "apple": return "Apple"
        }
    }

    return (
        <div className="w-full relative min-h-[350px] sm:min-h-[400px]" role="main" aria-label="Sign in">
            {/* Live region for announcements */}
            <LiveAnnouncer message={announcement} priority="assertive" />
            
            <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
                <DialogContent className={cn("sm:max-w-md sm:rounded-2xl", glass("overlay"))}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <DialogTitle>Authentication Not Available</DialogTitle>
                        </div>
                        <DialogDescription className="pt-4">
                            {providerToShow && getProviderName(providerToShow)} authentication is not available yet.
                            Please use email authentication to sign in.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={handleProviderDialogClose} className="w-full sm:w-auto">
                            OK, Got It
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="relative z-10 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    <div className="text-left space-y-2 mb-8">
                        <h1 id="login-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground text-base sm:text-lg">Enter your details to sign in</p>
                    </div>

                    {isDev && (
                        <div 
                            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4"
                            role="status"
                            aria-label="Development mode notice"
                        >
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm text-center">
                                <strong>Development Mode:</strong> Test credentials pre-filled. 
                                Click Sign In to continue.
                            </p>
                        </div>
                    )}
                    <form 
                        onSubmit={handleSubmit} 
                        className="space-y-4"
                        aria-labelledby="login-heading"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" aria-hidden="true" />
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("email")}
                                    disabled={isLoading}
                                    aria-invalid={!!form.formState.errors.email}
                                    aria-describedby={form.formState.errors.email ? "login-email-error" : undefined}
                                    autoComplete="email"
                                />
                            </div>
                            {form.formState.errors.email && (
                                <p id="login-email-error" className="text-sm text-destructive px-1" role="alert">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link 
                                    href="/forgot-password" 
                                    className="px-0 h-auto text-sm text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" aria-hidden="true" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("password")}
                                    disabled={isLoading}
                                    aria-invalid={!!form.formState.errors.password}
                                    aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                                    autoComplete="current-password"
                                />
                            </div>
                            {form.formState.errors.password && (
                                <p id="password-error" className="text-sm text-destructive px-1" role="alert">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>
                        <Button type="submit" className={buttonClasses} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className={cn("w-full border-t", glass("divider"))} />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className={cn("px-2 text-muted-foreground rounded-full", glass("subtle"))}>
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="lg" 
                            className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} 
                            onClick={() => handleSocialLogin("google")}
                            aria-label="Sign in with Google"
                        >
                            <GoogleIcon className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="lg" 
                            className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} 
                            onClick={() => handleSocialLogin("apple")}
                            aria-label="Sign in with Apple"
                        >
                            <AppleIcon className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="lg" 
                            className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} 
                            onClick={() => handleSocialLogin("github")}
                            aria-label="Sign in with GitHub"
                        >
                            <GitHubIcon className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Don&apos;t have an account? <Link href="/register" className="text-foreground font-semibold hover:underline">Sign up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
