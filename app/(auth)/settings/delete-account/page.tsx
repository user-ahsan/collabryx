import { AuthLayout } from "@/components/features/auth/auth-layout"
import { DeleteAccountForm } from "@/components/features/settings/delete-account-dialog"

export const dynamic = "force-dynamic"

export default function DeleteAccountPage() {
    return (
        <AuthLayout>
            <div className="w-full relative min-h-[22rem] sm:min-h-[26rem] py-4">
                <div className="text-left space-y-6 mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Delete Account</h1>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        Permanently delete your account and all your data
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-muted/50 border border-muted rounded-lg p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Account Deletion</h2>
                        <p className="text-muted-foreground">
                            This action is permanent and cannot be undone. Once you delete your account,
                            all your data will be permanently removed including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>Your profile information and settings</li>
                            <li>All your posts, comments, and reactions</li>
                            <li>All your connections and matches</li>
                            <li>All your messages and conversations</li>
                            <li>All your AI mentor session history</li>
                        </ul>
                    </div>

                    <DeleteAccountForm />
                </div>
            </div>
        </AuthLayout>
    )
}
