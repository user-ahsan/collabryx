import { revalidateTag, unstable_noStore as noStore } from 'next/cache'

export const CACHE_TAGS = {
  POSTS: 'posts',
  POSTS_BY_USER: 'posts-by-user',
  MATCHES: 'matches',
  MATCHES_BY_USER: 'matches-by-user',
  PROFILES: 'profiles',
  PROFILE_BY_USER: 'profile-by-user',
  CONNECTIONS: 'connections',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  USER_SKILLS: 'user-skills',
  USER_INTERESTS: 'user-interests',
  USER_EXPERIENCES: 'user-experiences',
  USER_PROJECTS: 'user-projects',
  AI_SESSIONS: 'ai-sessions',
  EMBEDDINGS: 'embeddings',
  ALL: 'all',
} as const

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS]

export const REVALIDATION = {
  IMMEDIATE: 0,
  FREQUENT: 30,
  MODERATE: 60,
  SLOW: 300,
  HOURLY: 3600,
  DAILY: 86400,
  NEVER: false,
} as const

export function revalidateByTag(tag: CacheTag) {
  try {
    revalidateTag(tag, 'default')
  } catch (error) {
    console.error(`Failed to revalidate tag ${tag}:`, error)
  }
}

export function revalidateMultipleTags(tags: CacheTag[]) {
  tags.forEach(tag => {
    try {
      revalidateTag(tag, 'default')
    } catch (error) {
      console.error(`Failed to revalidate tag ${tag}:`, error)
    }
  })
}

export function revalidateAll() {
  try {
    revalidateTag(CACHE_TAGS.ALL, 'default')
  } catch (error) {
    console.error('Failed to revalidate all:', error)
  }
}

export function disableCache() {
  noStore()
}

export function getCacheOptions(tag?: CacheTag, revalidate?: number | false) {
  const options: RequestInit['cache'] = revalidate === false ? 'no-store' : 'force-cache'
  
  const next: NextFetchRequestConfig = {}
  
  if (revalidate !== undefined && revalidate !== false) {
    next.revalidate = revalidate
  }
  
  if (tag) {
    next.tags = [tag, CACHE_TAGS.ALL]
  }
  
  return {
    cache: options,
    next,
  }
}

interface NextFetchRequestConfig {
  revalidate?: number | false
  tags?: string[]
}
