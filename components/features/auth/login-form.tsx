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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
})

export function LoginForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [showProviderDialog, setShowProviderDialog] = React.useState(false)
    const [providerToShow, setProviderToShow] = React.useState<"google" | "github" | "apple" | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })
        setIsLoading(false)

        if (error) {
            toast.error(error.message)
            return
        }

        window.location.href = "/auth-sync"
    }

    const handleSocialLogin = async (provider: "google" | "github" | "apple") => {
        setProviderToShow(provider)
        setShowProviderDialog(true)
    }

    const handleProviderDialogClose = () => {
        setShowProviderDialog(false)
        setProviderToShow(null)
    }

    const inputClasses = "pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
    const buttonClasses = "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl"

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
                <DialogContent className="sm:max-w-md">
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

                    <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    className={inputClasses}
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
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    className={inputClasses}
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
                            <span className="w-full border-t border-muted/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Button type="button" variant="outline" size="lg" className="w-full rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30" onClick={() => handleSocialLogin("google")}>
                            <GoogleIcon className="h-5 w-5" />
                            <span className="sr-only">Sign in with Google</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="w-full rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30" onClick={() => handleSocialLogin("apple")}>
                            <AppleIcon className="h-5 w-5" />
                            <span className="sr-only">Sign in with Apple</span>
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="w-full rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30" onClick={() => handleSocialLogin("github")}>
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
