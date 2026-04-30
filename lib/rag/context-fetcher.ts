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