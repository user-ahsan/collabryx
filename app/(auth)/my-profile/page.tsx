import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"

export default function MyProfilePage() {
    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-5xl">
            <ProfileHeader
                isOwnProfile={true}
                collaborationReadiness="available"
                isVerified={true}
                verificationType="student"
                university="Stanford University"
            />
            <ProfileTabs isOwnProfile={true} />
        </div>
    )
}
