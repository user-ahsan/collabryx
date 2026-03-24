"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
// import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
})

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const supabase = createClient()

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    })

    const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
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
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            setIsLoading(false)

            if (error) {
                setError(error.message)
                return
            }

            setIsSuccess(true)
        } catch {
            console.error("Password reset error:", err)
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
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Check your email</h1>
                            <p className="text-muted-foreground text-base sm:text-lg">
                                We&apos;ve sent you a password reset link
                            </p>
                        </div>

                        <Alert className={cn(glass("subtle"))}>
                            <Mail className="h-5 w-5" />
                            <AlertDescription>
                                We&apos;ve sent a password reset link to{" "}
                                <span className="font-medium text-foreground">{form.getValues("email")}</span>.
                                Please check your inbox and click the link to reset your password.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <Button asChild className={buttonClasses}>
                                <Link href="/login">Back to Login</Link>
                            </Button>

                            <Button
                                type="button"
                                variant="link"
                                className="w-full text-muted-foreground"
                                onClick={() => {
                                    setIsSuccess(false)
                                    form.reset()
                                }}
                            >
                                Didn&apos;t receive the email? Try again
                            </Button>
                        </div>
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
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Forgot password?</h1>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            No worries, we&apos;ll send you reset instructions
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className={cn(glass("overlay"))}>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                    id="email"
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

                        <Button type="submit" className={buttonClasses} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Reset Password"}
                        </Button>
                    </form>

                    <Button
                        type="button"
                        variant="link"
                        className="w-full text-muted-foreground"
                        asChild
                    >
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
