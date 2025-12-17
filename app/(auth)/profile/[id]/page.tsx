import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"

export default function ProfilePage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
            <ProfileHeader />
            <ProfileTabs />
        </div>
    )
}
