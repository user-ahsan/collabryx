import type { Metadata } from 'next'
import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

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
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
      <ProfileHeader
        displayName={profile.display_name || profile.full_name}
        headline={profile.headline}
        avatarUrl={profile.avatar_url}
        location={profile.location}
        websiteUrl={profile.website_url}
        isOwnProfile={false}
      />
      <ProfileTabs
        bio={profile.bio}
        lookingFor={profile.looking_for}
        isOwnProfile={false}
      />
    </div>
  )
}
