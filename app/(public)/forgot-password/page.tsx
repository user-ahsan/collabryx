import { AuthLayout } from "@/components/features/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form"

export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <ForgotPasswordForm />
        </AuthLayout>
    )
}
