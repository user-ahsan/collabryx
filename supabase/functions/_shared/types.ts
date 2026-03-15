export interface Profile {
  id: string
  full_name: string | null
  headline: string | null
  bio: string | null
  skills: string[] | null
  interests: string[] | null
  experiences: any[] | null
  projects: any[] | null
  avatar_url: string | null
  banner_url: string | null
  location: string | null
  looking_for: string | null
  available_for_mentorship: boolean | null
  available_for_hire: boolean | null
  completion_score: number
  updated_at: string
}

export interface EmbeddingRequest {
  user_id: string
  profile_data: Profile
}

export interface EmbeddingResponse {
  success: boolean
  embedding?: number[]
  error?: string
  queued?: boolean
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface MatchSuggestion {
  user_id: string
  matched_user_id: string
  score: number
  common_skills: string[]
  common_interests: string[]
  created_at: string
}

export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}
