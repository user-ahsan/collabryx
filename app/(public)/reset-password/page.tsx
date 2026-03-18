import { AuthLayout } from "@/components/features/auth/auth-layout"
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form"

export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <ResetPasswordForm />
        </AuthLayout>
    )
}
