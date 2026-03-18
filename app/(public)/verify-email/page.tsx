import { AuthLayout } from "@/components/features/auth/auth-layout"
import { VerifyEmailForm } from "@/components/features/auth/verify-email-form"

export const dynamic = "force-dynamic"

export default function VerifyEmailPage() {
    return (
        <AuthLayout>
            <VerifyEmailForm />
        </AuthLayout>
    )
}
