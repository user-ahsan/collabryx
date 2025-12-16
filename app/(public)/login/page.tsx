import { AuthLayout } from "@/components/features/auth/auth-layout"
import { UnifiedAuth } from "@/components/features/auth/unified-auth"

export default function LoginPage() {
    return (
        <AuthLayout>
            <UnifiedAuth defaultView="email" />
        </AuthLayout>
    )
}
