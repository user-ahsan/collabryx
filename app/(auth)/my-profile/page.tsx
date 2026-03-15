import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyProfilePage() {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')
    }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    
    if (!profile) {
        redirect('/onboarding')
    }
    
    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-5xl">
            <ProfileHeader
                displayName={profile.display_name || profile.full_name}
                headline={profile.headline}
                avatarUrl={profile.avatar_url}
                location={profile.location}
                websiteUrl={profile.website_url}
                isOwnProfile={true}
            />
            <ProfileTabs
                bio={profile.bio}
                lookingFor={profile.looking_for}
                isOwnProfile={true}
            />
        </div>
    )
}
