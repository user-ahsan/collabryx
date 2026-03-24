"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
// import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { useRouter } from "next/navigation"

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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

export function ResetPasswordForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [passwordValue, setPasswordValue] = React.useState("")
    const supabase = createClient()
    const router = useRouter()

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
        setIsLoading(true)
        setError(null)

        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            setError("Authentication service is not configured. Please contact support.")
            setIsLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            })
            setIsLoading(false)

            if (error) {
                setError(error.message)
                return
            }

            setIsSuccess(true)

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (error) {
            console.error("Password update error:", error)
            setError("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    const inputClasses = cn(
        "pl-10 h-12 transition-all rounded-xl",
        glass("input")
    )
    const buttonClasses = cn(
        "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl",
        glass("buttonPrimary")
    )

    if (isSuccess) {
        return (
            <div className="w-full relative min-h-[350px] sm:min-h-[400px]">
                <div className="relative z-10 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="text-left space-y-2 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Password updated!</h1>
                            <p className="text-muted-foreground text-base sm:text-lg">
                                Your password has been successfully reset
                            </p>
                        </div>

                        <Alert className={cn(glass("subtle"))}>
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-600 dark:text-green-400">
                                Your password has been updated. Redirecting to login page...
                            </AlertDescription>
                        </Alert>

                        <Button asChild className={buttonClasses}>
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full relative min-h-[350px] sm:min-h-[400px]">
            <div className="relative z-10 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    <div className="text-left space-y-2 mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Reset password</h1>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            Enter your new password below
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className={cn(glass("overlay"))}>
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a new password"
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
                                                calculatePasswordStrength(passwordValue) < 50
                                                    ? "bg-destructive"
                                                    : calculatePasswordStrength(passwordValue) < 80
                                                        ? "bg-yellow-500"
                                                        : "bg-green-500"
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
                                                    req.regex.test(passwordValue)
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        req.regex.test(passwordValue)
                                                            ? "bg-green-600 dark:bg-green-400"
                                                            : "bg-muted-foreground"
                                                    )}
                                                />
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    className={cn(inputClasses, "pl-10")}
                                    {...form.register("confirmPassword")}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive px-1">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" className={buttonClasses} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Update Password"}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
