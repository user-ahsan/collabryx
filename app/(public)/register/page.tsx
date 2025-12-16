import { AuthLayout } from "@/components/features/auth/auth-layout"
import { UnifiedAuth } from "@/components/features/auth/unified-auth"

export default function RegisterPage() {
    return (
        <AuthLayout>
            {/* Even for register, we can start with email check to unify flow, 
                 or likely users expect to just start entering details. 
                 But to keep "unified" promise, we start with email. 
                 If you want direct signup form, set defaultView="signup" */}
            <UnifiedAuth defaultView="email" />
        </AuthLayout>
    )
}
