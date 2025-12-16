"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleIcon, GitHubIcon, AppleIcon } from "@/components/ui/social-icons"

// --- Schemas ---

const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
})

const loginSchema = z.object({
    password: z.string().min(1, "Password is required."),
})

const signupSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    password: z.string().min(8, "Password must be at least 8 characters."),
})

// --- Types ---

type AuthView = "email" | "login" | "signup"

interface UnifiedAuthProps {
    defaultView?: AuthView // if we want to force a start state, though 'email' is usually best
}

export function UnifiedAuth({ defaultView = "email" }: UnifiedAuthProps) {
    const [view, setView] = React.useState<AuthView>(defaultView)
    const [email, setEmail] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [direction, setDirection] = React.useState(0) // -1 for back, 1 for forward

    // --- Forms ---

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    })

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { password: "" },
    })

    const signupForm = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: { fullName: "", password: "" },
    })

    // --- Handlers ---

    const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
        setIsLoading(true)
        // Simulate API check delay
        await new Promise((resolve) => setTimeout(resolve, 800))
        setIsLoading(false)

        setEmail(data.email)

        // MOCKED LOGIC: 
        // For demo purposes, we randomly assign "exists" or "new".
        // OR we can hardcode a specific email for testing. 
        // Let's say any email starting with "new" is new user, else existing.
        const isNewUser = data.email.startsWith("new")

        setDirection(1)
        if (isNewUser) {
            setView("signup")
        } else {
            setView("login")
        }
    }

    const onLoginSubmit = async () => {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setIsLoading(false)
        alert(`Logged in as ${email}`)
    }

    const onSignupSubmit = async (data: z.infer<typeof signupSchema>) => {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setIsLoading(false)
        alert(`Account created for ${data.fullName} (${email})`)
    }

    const handleBack = () => {
        setDirection(-1)
        setView("email")
    }



    // --- Animation Variants ---
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    }

    // --- Component Styles ---
    const inputClasses = "pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
    const buttonClasses = "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl"

    return (
        <div className="w-full relative min-h-[350px] sm:min-h-[400px] overflow-hidden">
            {/* No card background, just the content */}
            <div className="relative z-10 py-4">
                <AnimatePresence mode="popLayout" custom={direction}>
                    {view === "email" && (
                        <motion.div
                            key="email"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-6"
                        >
                            <div className="text-left space-y-2 mb-8">
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sign in</h1>
                                <p className="text-muted-foreground text-base sm:text-lg">Enter your email below to sign in</p>
                            </div>

                            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-medium">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            placeholder="m@example.com"
                                            className={inputClasses}
                                            {...emailForm.register("email")}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {emailForm.formState.errors.email && (
                                        <p className="text-sm text-destructive px-1">{emailForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <Button type="submit" className={buttonClasses} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
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

                            {/* Social Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                <Button variant="outline" className="w-full h-12 rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30">
                                    <GoogleIcon className="h-5 w-5" />
                                    <span className="sr-only">Sign in with Google</span>
                                </Button>
                                <Button variant="outline" className="w-full h-12 rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30">
                                    <AppleIcon className="h-5 w-5" />
                                    <span className="sr-only">Sign in with Apple</span>
                                </Button>
                                <Button variant="outline" className="w-full h-12 rounded-xl bg-transparent border-muted-foreground/20 hover:bg-muted/30">
                                    <GitHubIcon className="h-5 w-5" />
                                    <span className="sr-only">Sign in with GitHub</span>
                                </Button>
                            </div>

                            <p className="text-center text-sm text-muted-foreground mt-6">
                                Don&apos;t have an account? <span className="text-foreground font-semibold cursor-pointer hover:underline" onClick={() => { setDirection(1); setView("signup"); }}>Sign up</span>
                            </p>

                        </motion.div>
                    )}

                    {view === "login" && (
                        <motion.div
                            key="login"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-6"
                        >
                            <div className="text-left space-y-2 mb-8">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h1>
                                    <button onClick={handleBack} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Not you?
                                    </button>

                                </div>

                                <div className="flex items-center gap-2 text-muted-foreground bg-muted/20 py-1 px-3 rounded-full w-fit">
                                    <Mail className="h-3 w-3" />
                                    <span className="text-sm">{email}</span>
                                </div>
                            </div>

                            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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
                                            {...loginForm.register("password")}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {loginForm.formState.errors.password && (
                                        <p className="text-sm text-destructive px-1">{loginForm.formState.errors.password.message}</p>
                                    )}
                                </div>
                                <Button type="submit" className={buttonClasses} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                                </Button>
                            </form>

                        </motion.div>
                    )}

                    {view === "signup" && (
                        <motion.div
                            key="signup"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-6"
                        >
                            <div className="text-left space-y-2 mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create an account</h1>
                                <p className="text-muted-foreground text-base sm:text-lg">Enter your details to get started</p>
                            </div>

                            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            placeholder="John Doe"
                                            className={inputClasses}
                                            {...signupForm.register("fullName")}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {signupForm.formState.errors.fullName && (
                                        <p className="text-sm text-destructive px-1">{signupForm.formState.errors.fullName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="Create a password"
                                            className={inputClasses}
                                            {...signupForm.register("password")}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {signupForm.formState.errors.password && (
                                        <p className="text-sm text-destructive px-1">{signupForm.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <Button type="submit" className={buttonClasses} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
                                </Button>
                            </form>
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                By clicking continue, you agree to our <a href="#" className="underline hover:text-primary">Terms</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                            </p>
                            <div className="text-center mt-4">
                                <span className="text-sm text-muted-foreground">Already have an account? </span>
                                <span className="text-sm font-semibold cursor-pointer hover:underline text-primary" onClick={() => { setDirection(-1); setView("email"); }}>Sign in</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
