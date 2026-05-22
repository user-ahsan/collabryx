import { redirect } from "next/navigation"
import { AuthLayout } from "@/components/features/auth/auth-layout"
import { VerifyEmailForm } from "@/components/features/auth/verify-email-form"

export const dynamic = "force-dynamic"

export default function VerifyEmailPage() {
    // Server-side guard: skip directly to onboarding if email verification is disabled
    if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
        redirect("/onboarding")
    }

    return (
        <AuthLayout>
            <VerifyEmailForm />
        </AuthLayout>
    )
}
