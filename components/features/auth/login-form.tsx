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

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
})

export function LoginForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [showProviderDialog, setShowProviderDialog] = React.useState(false)
    const [providerToShow, setProviderToShow] = React.useState<"google" | "github" | "apple" | null>(null)
    const supabase = createClient()

    // Pre-populate test credentials in development mode
    const isDev = isDevelopmentMode()
    const devCredentials = isDev ? getDevelopmentCredentials() : { email: "", password: "" }

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { 
            email: isDev ? devCredentials.email : "", 
            password: isDev ? devCredentials.password : "" 
        },
    })

    const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
        setIsLoading(true)
        
        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            toast.error("Authentication service is not configured. Please contact support.")
            setIsLoading(false)
            // Redirect to home page with error
            setTimeout(() => {
                window.location.assign("/")
            }, 2000)
            return
        }
        
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })
            setIsLoading(false)

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success("Welcome back!")
            window.location.assign("/auth-sync")
        } catch (err) {
            console.error('Login error:', err)
            toast.error("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    const handleSocialLogin = async (provider: "google" | "github" | "apple") => {
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
        <div className="w-full relative min-h-[350px] sm:min-h-[400px]">
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
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground text-base sm:text-lg">Enter your details to sign in</p>
                    </div>

                    {isDev && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm text-center">
                                <strong>Development Mode:</strong> Test credentials pre-filled. 
                                Click Sign In to continue.
                            </p>
                        </div>
                    )}
                    <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("email")}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive px-1">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <Button variant="link" className="px-0 h-auto text-sm text-muted-foreground hover:text-primary" tabIndex={-1}>
                                    Forgot password?
                                </Button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("password")}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive px-1">{form.formState.errors.password.message}</p>
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
                        <Button type="button" variant="outline" size="lg" className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} onClick={() => handleSocialLogin("google")}>
                            <GoogleIcon className="h-5 w-5" />
                            <span className="sr-only">Sign in with Google</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} onClick={() => handleSocialLogin("apple")}>
                            <AppleIcon className="h-5 w-5" />
                            <span className="sr-only">Sign in with Apple</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} onClick={() => handleSocialLogin("github")}>
                            <GitHubIcon className="h-5 w-5" />
                            <span className="sr-only">Sign in with GitHub</span>
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
