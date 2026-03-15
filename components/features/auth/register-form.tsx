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

import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

const signupSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
})

const passwordRequirements = [
    { label: "At least 8 characters", regex: /.{8,}/ },
    { label: "Contains uppercase letter", regex: /[A-Z]/ },
    { label: "Contains lowercase letter", regex: /[a-z]/ },
    { label: "Contains number", regex: /[0-9]/ },
    { label: "Contains special character", regex: /[^A-Za-z0-9]/ },
]

const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 20
    if (password.length >= 12) strength += 10
    if (/[A-Z]/.test(password)) strength += 20
    if (/[a-z]/.test(password)) strength += 20
    if (/[0-9]/.test(password)) strength += 15
    if (/[^A-Za-z0-9]/.test(password)) strength += 15
    return Math.min(strength, 100)
}

export function RegisterForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [showProviderDialog, setShowProviderDialog] = React.useState(false)
    const [providerToShow, setProviderToShow] = React.useState<"google" | "github" | "apple" | null>(null)
    const [passwordValue, setPasswordValue] = React.useState("")
    const supabase = createClient()

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", password: "" },
    })

    const onSignupSubmit = async (data: z.infer<typeof signupSchema>) => {
        setIsLoading(true)
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        })
        setIsLoading(false)

        if (error) {
            toast.error(error.message)
            return
        }

        toast.success("Account created! Redirecting...")
        window.location.assign("/auth-sync")
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
                            Please use email authentication to create an account.
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
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-muted-foreground text-base sm:text-lg">Enter your details to get started</p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSignupSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="signup-email"
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
                            <Label htmlFor="new-password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Create a password"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("password")}
                                    onChange={(e) => {
                                        form.register("password").onChange(e)
                                        setPasswordValue(e.target.value)
                                    }}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive px-1">{form.formState.errors.password.message}</p>
                            )}
                            
                            {passwordValue && (
                                <div className="space-y-2 pt-2">
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className={cn(
                                                "h-full transition-all duration-300",
                                                calculatePasswordStrength(passwordValue) < 50 ? "bg-destructive" :
                                                calculatePasswordStrength(passwordValue) < 80 ? "bg-yellow-500" :
                                                "bg-green-500"
                                            )}
                                            style={{ width: `${calculatePasswordStrength(passwordValue)}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {passwordRequirements.map((req) => (
                                            <div 
                                                key={req.label}
                                                className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    req.regex.test(passwordValue) ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    req.regex.test(passwordValue) ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground"
                                                )} />
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className={buttonClasses} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
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
                            <span className="sr-only">Sign up with Google</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} onClick={() => handleSocialLogin("apple")}>
                            <AppleIcon className="h-5 w-5" />
                            <span className="sr-only">Sign up with Apple</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className={cn("w-full rounded-xl transition-all", glass("buttonGhost"))} onClick={() => handleSocialLogin("github")}>
                            <GitHubIcon className="h-5 w-5" />
                            <span className="sr-only">Sign up with GitHub</span>
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-4">
                        By clicking continue, you agree to our <a href="#" className="underline hover:text-primary">Terms</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                    </p>
                    <div className="text-center mt-4">
                        <span className="text-sm text-muted-foreground">Already have an account? </span>
                        <Link href="/login" className="text-sm font-semibold hover:underline text-primary">Sign in</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
