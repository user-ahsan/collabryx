import { redirect } from "next/navigation"
import { AuthLayout } from "@/components/features/auth/auth-layout"
import { VerifyEmailForm } from "@/components/features/auth/verify-email-form"

export const dynamic = "force-dynamic"

export default function VerifyEmailPage() {
    // Server-side guard: skip directly to onboarding if email verification is disabled.
    // This reads runtime env vars correctly (server component), NOT build-time inlined values.
    const skipEmail = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === "true"
    if (skipEmail) {
        redirect("/onboarding?skipEmail=1")
    }

    return (
        <AuthLayout>
            <VerifyEmailForm skipEmailVerification={false} />
        </AuthLayout>
    )
}
