import { AuthLayout } from "@/components/features/auth/auth-layout"
import { LoginForm } from "@/components/features/auth/login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    )
}
