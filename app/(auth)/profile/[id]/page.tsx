import type { Metadata } from 'next'
import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConnectionButton } from '@/components/features/connections/connection-button'
import { MatchScore } from '@/components/shared/match-score'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: profileId } = await params
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, headline, bio, avatar_url')
    .eq('id', profileId)
    .single()
  
  if (!profile) {
    return {
      title: 'Profile Not Found',
      robots: { index: false, follow: false },
    }
  }
  
  const title = `${profile.full_name || 'User Profile'} | Collabryx`
  const description = profile.bio || profile.headline || `View ${profile.full_name}'s profile on Collabryx`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url, alt: profile.full_name || 'Profile' }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, user_skills(*), user_experiences(*), user_projects(*)')
    .eq('id', profileId)
    .single()
  
  if (!profile) {
    notFound()
  }
  
  // Get current user for connection button and match score
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profileId
  
  // Calculate simple match score based on shared skills (placeholder - real scoring in matches page)
  let matchScore = 0
  if (user && !isOwnProfile) {
    // Fetch current user's skills for comparison
    const { data: currentUserSkills } = await supabase
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', user.id)
    
    const currentUserSkillSet = new Set(currentUserSkills?.map((s: { skill_name: string }) => s.skill_name) || [])
    const profileSkills = profile.user_skills || []
    const sharedSkills = profileSkills.filter((s: { skill_name: string }) => currentUserSkillSet.has(s.skill_name))
    
    // Simple score: percentage of shared skills (max 100)
    matchScore = profileSkills.length > 0 
      ? Math.round((sharedSkills.length / profileSkills.length) * 100)
      : 50 // Default if no skills
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <ProfileHeader
          displayName={profile.display_name || profile.full_name}
          headline={profile.headline}
          avatarUrl={profile.avatar_url}
          location={profile.location}
          websiteUrl={profile.website_url}
          isOwnProfile={isOwnProfile}
        />
        {!isOwnProfile && user && (
          <div className="flex flex-col gap-3 shrink-0">
            <ConnectionButton userId={profileId} variant="default" size="default" />
            {matchScore > 0 && (
              <MatchScore 
                overall={matchScore} 
                showBreakdown={false}
                className="w-full sm:w-[200px]"
              />
            )}
          </div>
        )}
      </div>
      <ProfileTabs
        bio={profile.bio}
        lookingFor={profile.looking_for}
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}
