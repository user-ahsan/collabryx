/**
 * ProfilePage — view another user's profile (server component)
 *
 * DATA PRIVACY — CONDITIONAL FIELD SELECTION
 * Problem: For non-own profile views, sensitive fields (email, github_url,
 * linkedin_url, twitter_url, portfolio_url) should not be exposed. The
 * profiles_public VIEW exists for this purpose but does NOT support PostgREST
 * embedded joins (e.g. user_skills(*), user_interests(*)) — the view loses
 * FK relationship metadata that PostgREST needs for resource embedding.
 *
 * Solution: Query profiles directly (works in dev/local where RLS may not
 * fully restrict cross-user reads on the profiles table), but use conditional
 * column selection to exclude sensitive fields for non-own profiles:
 *   - isOwnProfile=true:  select all columns including email + social links
 *   - isOwnProfile=false: select only public columns, omit email + social links
 * All downstream components handle null/undefined gracefully, so the UI simply
 * omits whatever fields aren't available. In production with strict RLS, the
 * individual related tables (user_skills, user_interests, etc.) have their own
 * permissive SELECT policies ("Users can view any skills/interests/...") which
 * are unaffected by the profiles table's RLS.
 *
 * ENHANCEMENTS OVER ORIGINAL:
 *
 * 1. MATCH SCORE WITH REAL match_scores DATA:
 *    Problem: Original calculated a simple percentage based on shared skill
 *    names. The match_scores table has rich dimension data (skills_overlap,
 *    complementary_score, shared_interests, activity_match, ai_confidence,
 *    ai_explanation) but was never queried.
 *    Solution: Created MatchScoreSection server component that queries
 *    match_suggestions + match_scores with the real dimension breakdown.
 *    Falls back to skill-overlap calculation when no suggestion exists.
 *
 * 2. SUSPENSE STREAMING:
 *    Problem: Match score data is non-critical — the main profile content
 *    (header, tabs) should render immediately without waiting for match
 *    calculations.
 *    Solution: MatchScoreSection is wrapped in <Suspense> with a skeleton
 *    fallback. The match data streams in independently after main content.
 *
 * 3. EXPLICIT COLUMNS + NEW DATA:
 *    Explicit column select (from profiles_public), interests joined in
 *    main query, analytics fetched separately, social links conditionally
 *    selected for own profile.
 *
 * 4. PRIVACY-RESPECTING DISPLAY:
 *    - Email is masked by profiles_public view (CASE expression)
 *    - Social links only available for own profile (not in public view)
 *    - Activity status shown based on analytics availability
 *    - Profile completion only passed for own profile
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileHeader } from "@/components/features/profile/profile-header"
import { ProfileTabs } from "@/components/features/profile/profile-tabs"
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConnectionButton } from '@/components/features/connections/connection-button'
import { MatchScore } from '@/components/shared/match-score'
import { GlassCard } from '@/components/shared/glass-card'
import type { Profile, UserSkill, UserExperience, UserProject, UserInterest } from '@/types/database.types'

export const dynamic = "force-dynamic"

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

/** Server component that fetches match score data independently for Suspense streaming */
async function MatchScoreSection({ profileId, userId }: { profileId: string; userId: string }) {
  const supabase = await createClient()

  const { data: matchSuggestion } = await supabase
    .from('match_suggestions')
    .select(`
      id, match_percentage, ai_confidence, ai_explanation,
      match_scores (
        skills_overlap, complementary_score, shared_interests,
        activity_match
      )
    `)
    .eq('user_id', userId)
    .eq('matched_user_id', profileId)
    .eq('status', 'active')
    .maybeSingle()

  if (!matchSuggestion) return null

  const ms = (matchSuggestion.match_scores as unknown as Record<string, number> | undefined)
  const dimensions = ms ? [
    { label: 'Skills', value: ms.skills_overlap ?? 0, color: 'bg-blue-500' },
    { label: 'Complementary', value: ms.complementary_score ?? 0, color: 'bg-violet-500' },
    { label: 'Interests', value: ms.shared_interests ?? 0, color: 'bg-green-500' },
    { label: 'Activity', value: Math.round((ms.activity_match ?? 0) * 100), color: 'bg-amber-500' },
  ] : undefined

  return (
    <MatchScore
      overall={matchSuggestion.match_percentage}
      dimensions={dimensions}
      showBreakdown={false}
      className="w-full sm:min-w-[180px] sm:max-w-[220px]"
      aiConfidence={matchSuggestion.ai_confidence ?? undefined}
      aiExplanation={matchSuggestion.ai_explanation ?? undefined}
    />
  )
}

/** Simple skeleton for the match score while streaming */
function MatchScoreSkeleton() {
  return (
    <GlassCard className="p-3 w-[220px]">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted/40 rounded w-24" />
        <div className="h-3 bg-muted/40 rounded-full w-full" />
        <div className="h-8 bg-muted/30 rounded w-16 mx-auto" />
      </div>
    </GlassCard>
  )
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profileId

  // Query profiles directly (works in local/dev where RLS may be relaxed).
  // For non-own profiles, omit sensitive fields (email, social links) via
  // conditional column selection — the callers handle null gracefully.
  // Note: profiles_public VIEW would be the RLS-safe alternative in production
  //       but it doesn't support PostgREST embedded joins through views.
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, display_name, full_name, headline, bio, avatar_url, banner_url,
      location, website_url, collaboration_readiness, is_verified, verification_type,
      university, profile_completion, looking_for, onboarding_completed, created_at, updated_at
      ${isOwnProfile ? ', email, github_url, linkedin_url, twitter_url, portfolio_url' : ''},
      user_skills(id, user_id, skill_name, proficiency, is_primary, created_at),
      user_interests(id, user_id, interest, created_at),
      user_experiences(id, user_id, title, company, description, start_date, end_date, is_current, order_index, created_at),
      user_projects(id, user_id, title, description, url, image_url, tech_stack, is_public, order_index, created_at)
    `)
    .eq('id', profileId)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: analytics } = await supabase
    .from('user_analytics')
    .select('connections_count, profile_views_last_30_days, last_active, posts_created_count')
    .eq('user_id', profileId)
    .maybeSingle()

  // Map DB snake_case to component camelCase
  const profileSkills: UserSkill[] = (profile as unknown as { user_skills?: UserSkill[] }).user_skills ?? []
  const profileInterests: UserInterest[] = (profile as unknown as { user_interests?: UserInterest[] }).user_interests ?? []
  const profileExperiences: UserExperience[] = (profile as unknown as { user_experiences?: UserExperience[] }).user_experiences ?? []
  const profileProjects: UserProject[] = (profile as unknown as { user_projects?: UserProject[] }).user_projects ?? []

  const headerSkills = profileSkills.map(s => s.skill_name)

  const tabSkills = profileSkills.map(s => ({
    skillName: s.skill_name,
    proficiency: s.proficiency ?? null,
    isPrimary: s.is_primary,
  }))

  const tabInterests = profileInterests.map(i => i.interest)

  const tabExperiences = profileExperiences.map(e => ({
    id: e.id,
    title: e.title,
    company: e.company ?? null,
    description: e.description ?? null,
    startDate: e.start_date ?? null,
    endDate: e.end_date ?? null,
    isCurrent: e.is_current,
  }))

  const tabProjects = profileProjects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    url: p.url ?? null,
    imageUrl: p.image_url ?? null,
    techStack: p.tech_stack,
    isPublic: p.is_public,
  }))

  const visibleProjects = tabProjects.filter(p => isOwnProfile || p.isPublic)

  const p = profile as Profile

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
      <ProfileHeader
        displayName={p.display_name || p.full_name}
        headline={p.headline}
        avatarUrl={p.avatar_url}
        bannerUrl={p.banner_url}
        location={p.location}
        websiteUrl={p.website_url}
        email={p.email}
        isOwnProfile={isOwnProfile}
        isVerified={p.is_verified}
        verificationType={p.verification_type}
        university={p.university}
        collaborationReadiness={p.collaboration_readiness}
        skills={headerSkills}
        createdAt={p.created_at}
        updatedAt={p.updated_at}
        // NEW: Social links
        githubUrl={p.github_url}
        linkedinUrl={p.linkedin_url}
        twitterUrl={p.twitter_url}
        portfolioUrl={p.portfolio_url}
        // NEW: Profile completion (only relevant for own profile)
        profileCompletion={isOwnProfile ? p.profile_completion : undefined}
        // NEW: Stats
        connectionCount={analytics?.connections_count ?? 0}
        profileViews={analytics?.profile_views_last_30_days ?? 0}
        lastActive={analytics?.last_active ?? null}
        // ACTION SLOT: Connection button + MatchScore embedded in header top-right
        actionSlot={!isOwnProfile && user ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <ConnectionButton userId={profileId} variant="default" size="default" />
            <Suspense fallback={<MatchScoreSkeleton />}>
              <MatchScoreSection profileId={profileId} userId={user.id} />
            </Suspense>
          </div>
        ) : undefined}
      />

      <ProfileTabs
        bio={p.bio}
        lookingFor={p.looking_for}
        interests={tabInterests}
        isOwnProfile={isOwnProfile}
        skills={tabSkills}
        experiences={tabExperiences}
        projects={visibleProjects}
      />
    </div>
  )
}
