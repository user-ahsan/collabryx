import { createClient } from '@/lib/supabase/server'
import type { UserProfileContext } from './types'

export interface ContextFetcherResult {
  data: UserProfileContext | null
  error: Error | null
  warnings: string[]
}

export async function fetchUserProfileContext(
  userId: string
): Promise<ContextFetcherResult> {
  const warnings: string[] = []
  const supabase = await createClient()

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, headline, bio, looking_for, location')
    .eq('id', userId)
    .single()

  if (profileError) {
    return {
      data: null,
      error: new Error(`Failed to fetch profile: ${profileError.message}`),
      warnings: ['Profile fetch failed'],
    }
  }

  if (!profileData) {
    return {
      data: null,
      error: new Error('Profile not found'),
      warnings: ['Profile not found'],
    }
  }

  // TODO: Include non-primary skills in AI context with lower weight. Currently only
  // fetches is_primary:true skills, which misses relevant secondary skills. (#159)
  let skills: { skill_name: string; proficiency?: string }[] = []
  const { data: skillsData, error: skillsError } = await supabase
    .from('user_skills')
    .select('skill_name, proficiency')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .limit(10)

  if (skillsError) {
    warnings.push('Skills fetch failed, continuing with empty skills')
  } else if (skillsData) {
    skills = skillsData
  }

  let interests: { interest: string }[] = []
  const { data: interestsData, error: interestsError } = await supabase
    .from('user_interests')
    .select('interest')
    .eq('user_id', userId)
    .limit(10)

  if (interestsError) {
    warnings.push('Interests fetch failed, continuing with empty interests')
  } else if (interestsData) {
    interests = interestsData
  }

  const lookingForArray = profileData.looking_for
    ? Array.isArray(profileData.looking_for)
      ? profileData.looking_for
      : [profileData.looking_for]
    : []

  const career_level = inferCareerLevel(profileData, skills.length)

  const result: UserProfileContext = {
    user_id: profileData.id,
    display_name: profileData.display_name || 'Anonymous User',
    headline: profileData.headline,
    bio: profileData.bio,
    looking_for: lookingForArray,
    skills,
    interests,
    career_level,
    location: profileData.location || undefined,
  }

  return { data: result, error: null, warnings }
}

export function inferCareerLevel(
  profile: { display_name?: string; headline?: string | null; bio?: string | null },
  skillsCount: number
): UserProfileContext['career_level'] {
  const headline = profile.headline?.toLowerCase() || ''
  const bio = profile.bio?.toLowerCase() || ''

const seniorKeywords = ['senior', 'lead', 'manager', 'director', 'principal', 'staff', 'head of']
  const executiveKeywords = ['ceo', 'cto', 'cfo', 'co-founder', 'founder', 'chief', 'vp', 'vice president']
  const earlyKeywords = ['intern', 'junior', 'entry', 'freshman', 'new grad']

  const headlineWords = headline.split(/\s+/).filter(w => w.length > 0)

  const hasExecutive = executiveKeywords.some((kw) => {
    if (kw.includes(' ')) {
      return headline.includes(kw) || bio.includes(kw)
    }
    return headlineWords.includes(kw) || bio.split(/\s+/).filter(w => w.length > 0).includes(kw)
  })
  if (hasExecutive) return 'executive'

  const hasSenior = seniorKeywords.some((kw) => headline.includes(kw))
  if (hasSenior) return 'senior'

  const hasEarly = earlyKeywords.some((kw) => headlineWords.includes(kw))
  if (hasEarly) return 'early-career'

  const profileCompleteness = [
    profile.display_name,
    profile.headline,
    profile.bio,
  ].filter(Boolean).length

  if (profileCompleteness >= 3 && skillsCount >= 5) {
    return 'mid-career'
  }

  if (profileCompleteness >= 2 && skillsCount >= 2) {
    return 'mid-career'
  }

  if (profileCompleteness >= 1 && skillsCount >= 1) {
    return 'early-career'
  }

  return 'student'
}

/**
 * Fetch profile contexts for multiple users (for collaboration advice).
 * Returns a map of userId -> UserProfileContext.
 * Failed fetches are silently skipped (no warnings for partial failures).
 */
export async function fetchMultipleUserContexts(
  userIds: string[]
): Promise<Map<string, UserProfileContext>> {
  const results = new Map<string, UserProfileContext>()

  // Fetch all profiles in a single query
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, headline, bio, looking_for, location')
    .in('id', userIds)

  if (!profiles || profiles.length === 0) {
    return results
  }

  // Fetch skills for all users
  // TODO: Include non-primary skills in AI context with lower weight. (#159)
  const { data: allSkills } = await supabase
    .from('user_skills')
    .select('user_id, skill_name, proficiency')
    .in('user_id', userIds)
    .eq('is_primary', true)
    .limit(100)

  // Fetch interests for all users
  const { data: allInterests } = await supabase
    .from('user_interests')
    .select('user_id, interest')
    .in('user_id', userIds)
    .limit(100)

  // Group skills and interests by user
  const skillsByUser = new Map<string, typeof allSkills>()
  const interestsByUser = new Map<string, typeof allInterests>()

  for (const skill of allSkills || []) {
    const existing = skillsByUser.get(skill.user_id) || []
    existing.push(skill)
    skillsByUser.set(skill.user_id, existing)
  }

  for (const interest of allInterests || []) {
    const existing = interestsByUser.get(interest.user_id) || []
    existing.push(interest)
    interestsByUser.set(interest.user_id, existing)
  }

  // Build context for each user
  for (const profile of profiles) {
    const skills = skillsByUser.get(profile.id) || []
    const interests = interestsByUser.get(profile.id) || []

    const lookingForArray = profile.looking_for
      ? Array.isArray(profile.looking_for)
        ? profile.looking_for
        : [profile.looking_for]
      : []

    results.set(profile.id, {
      user_id: profile.id,
      display_name: profile.display_name || 'Anonymous User',
      headline: profile.headline,
      bio: profile.bio,
      looking_for: lookingForArray,
      skills,
      interests,
      career_level: inferCareerLevel(profile, skills.length),
      location: profile.location || undefined,
    })
  }

  return results
}