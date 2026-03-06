import { AuthLayout } from "@/components/features/auth/auth-layout"
import { RegisterForm } from "@/components/features/auth/register-form"

export const dynamic = "force-dynamic"

export default function RegisterPage() {
    return (
        <AuthLayout>
            <RegisterForm />
        </AuthLayout>
    )
}
