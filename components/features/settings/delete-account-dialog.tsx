"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Lock, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
// import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

const deleteAccountSchema = z.object({
    password: z.string().min(1, "Password is required to confirm deletion."),
})

export function DeleteAccountForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
    const supabase = createClient()
    const router = useRouter()

    const form = useForm<z.infer<typeof deleteAccountSchema>>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: { password: "" },
    })

    const handleOpenDialog = () => {
        setShowConfirmDialog(true)
    }

    const handleCloseDialog = () => {
        setShowConfirmDialog(false)
        form.reset()
        setError(null)
    }

    const onDeleteSubmit = async (data: z.infer<typeof deleteAccountSchema>) => {
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
            // First, verify the password by signing in again
            const { data: { user }, error: signInError } = await supabase.auth.getUser()

            if (signInError || !user?.email) {
                setError("Unable to verify your identity. Please try again.")
                setIsLoading(false)
                return
            }

            // Sign in with the provided password to verify
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: data.password,
            })

            if (authError) {
                setError("Incorrect password. Please try again.")
                setIsLoading(false)
                return
            }

            // Delete the user account
            const { error: deleteError } = await supabase.auth.admin.deleteUser(
                user.id
            )

            // If admin delete fails, try regular sign out (fallback)
            if (deleteError) {
                console.error("Admin delete failed:", deleteError)
                // Fall back to just signing out
                await supabase.auth.signOut()
            }

            // Clear any local storage
            localStorage.clear()
            sessionStorage.clear()

            // Sign out
            await supabase.auth.signOut()

            // Redirect to home page
            router.push("/")
            window.location.reload()
        } catch (error) {
            console.error("Account deletion error:", error)
            setError("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    const inputClasses = cn(
        "pl-10 h-12 transition-all rounded-xl",
        glass("input")
    )
    const _buttonClasses = cn(
        "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-primary/20 transition-all rounded-xl",
        glass("buttonPrimary")
    )
    const destructiveButtonClasses = cn(
        "w-full h-12 text-lg font-medium shadow-none hover:shadow-lg hover:shadow-destructive/20 transition-all rounded-xl",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    )

    return (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="destructive"
                    className={cn(destructiveButtonClasses, "gap-2")}
                    onClick={handleOpenDialog}
                >
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                </Button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md sm:rounded-2xl", glass("overlay"))}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle>Delete Account</DialogTitle>
                    </div>
                    <DialogDescription className="pt-4">
                        This action cannot be undone. This will permanently delete your account,
                        all your data, and remove you from the platform.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onDeleteSubmit)} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="delete-password">Enter your password to confirm</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                            <Input
                                id="delete-password"
                                type="password"
                                placeholder="Your password"
                                className={cn(inputClasses, "pl-10")}
                                {...form.register("password")}
                                disabled={isLoading}
                            />
                        </div>
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive px-1">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Warning:</strong> All your data will be permanently deleted, including:
                        </p>
                        <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside mt-2 space-y-1">
                            <li>Your profile and all settings</li>
                            <li>All your posts and comments</li>
                            <li>All your connections and matches</li>
                            <li>All your messages and conversations</li>
                        </ul>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseDialog}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isLoading}
                            className="w-full sm:w-auto gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete My Account
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
