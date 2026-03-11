// ===========================================
// DEVELOPMENT MODE SERVICE
// ===========================================
// Provides test user and auto-completes onboarding in development

import { createClient } from "@/lib/supabase/client"
import type { Profile, UserSkill, UserExperience, UserProject } from "@/types/database.types"

const DEVELOPMENT_MODE = process.env.DEVELOPMENT_MODE === "true"
const TEST_USER_EMAIL = "test123@collabryx.com"
const TEST_USER_PASSWORD = "test123"

export interface DevelopmentUser {
  email: string
  password: string
  profile: Partial<Profile>
  skills: Omit<UserSkill, "id" | "user_id" | "created_at">[]
  interests: string[]
  experiences: Omit<UserExperience, "id" | "user_id" | "created_at">[]
  projects: Omit<UserProject, "id" | "user_id" | "created_at">[]
}

export const TEST_USER: DevelopmentUser = {
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
  profile: {
    full_name: "Test User",
    display_name: "Test User",
    headline: "Software Developer",
    bio: "This is a test user for development mode. Feel free to modify this profile.",
    collaboration_readiness: "available",
    is_verified: true,
    verification_type: "student",
    university: "Test University",
    profile_completion: 100,
    looking_for: ["cofounder", "teammate"],
    onboarding_completed: true,
  },
  skills: [
    { skill_name: "React", proficiency: "advanced", is_primary: true },
    { skill_name: "TypeScript", proficiency: "advanced", is_primary: false },
    { skill_name: "Node.js", proficiency: "intermediate", is_primary: false },
    { skill_name: "Python", proficiency: "beginner", is_primary: false },
  ],
  interests: ["AI/ML", "Startups", "Open Source", "Web Development"],
  experiences: [
    {
      title: "Software Developer",
      company: "Test Company",
      description: "Working on web applications and AI integration",
      start_date: "2023-01-01",
      is_current: true,
      order_index: 0,
    },
  ],
  projects: [
    {
      title: "Collabryx",
      description: "A platform for connecting developers and entrepreneurs",
      url: "https://collabryx.app",
      tech_stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS"],
      is_public: true,
      order_index: 0,
    },
  ],
}

/**
 * Check if running in development mode
 */
export function isDevelopmentMode(): boolean {
  return DEVELOPMENT_MODE
}

/**
 * Get or create test user in development mode
 */
export async function getOrCreateTestUser(): Promise<{
  user: { id: string; email?: string } | null
  error: Error | null
  isNewUser: boolean
}> {
  if (!isDevelopmentMode()) {
    return { user: null, error: null, isNewUser: false }
  }

  const supabase = createClient()

  try {
    // Try to sign in with test credentials
    const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (existingUser && !signInError) {
      console.log("[Dev Mode] Signed in existing test user:", existingUser.email)
      return { user: { id: existingUser.id, email: existingUser.email }, error: null, isNewUser: false }
    }

    // If sign in failed, try to sign up
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (signUpError) {
      console.error("[Dev Mode] Error signing up test user:", signUpError)
      return { user: null, error: signUpError, isNewUser: false }
    }

    console.log("[Dev Mode] Created new test user:", newUser?.email)
    return { user: { id: newUser?.id || "", email: newUser?.email }, error: null, isNewUser: true }
  } catch (error) {
    console.error("[Dev Mode] Error with test user:", error)
    return { user: null, error: error instanceof Error ? error : new Error("Unknown error"), isNewUser: false }
  }
}

/**
 * Complete onboarding for test user in development mode
 * This will create/update the profile and related data
 */
export async function completeTestUserOnboarding(): Promise<{
  success: boolean
  error: Error | null
}> {
  if (!isDevelopmentMode()) {
    return { success: false, error: null }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: new Error("No user found") }
  }

  try {
    // Upsert profile (will update if exists, create if not)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email || TEST_USER.email,
        ...TEST_USER.profile,
      }, { onConflict: "id" })

    if (profileError) {
      console.error("[Dev Mode] Error upserting profile:", profileError)
      return { success: false, error: profileError }
    }

    // Upsert skills
    for (const skill of TEST_USER.skills) {
      await supabase
        .from("user_skills")
        .upsert({
          user_id: user.id,
          skill_name: skill.skill_name,
          proficiency: skill.proficiency,
          is_primary: skill.is_primary,
        }, { onConflict: "user_id,skill_name" })
    }

    // Upsert interests
    for (const interest of TEST_USER.interests) {
      await supabase
        .from("user_interests")
        .upsert({
          user_id: user.id,
          interest,
        }, { onConflict: "user_id,interest" })
    }

    // Upsert experiences
    for (const exp of TEST_USER.experiences) {
      await supabase
        .from("user_experiences")
        .upsert({
          user_id: user.id,
          ...exp,
        }, { onConflict: "user_id,title" })
    }

    // Upsert projects
    for (const project of TEST_USER.projects) {
      await supabase
        .from("user_projects")
        .upsert({
          user_id: user.id,
          ...project,
        }, { onConflict: "user_id,title" })
    }

    console.log("[Dev Mode] Test user onboarding completed successfully")
    return { success: true, error: null }
  } catch (error) {
    console.error("[Dev Mode] Error completing onboarding:", error)
    return { success: false, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get development user credentials
 */
export function getDevelopmentCredentials(): { email: string; password: string } {
  return {
    email: TEST_USER.email,
    password: TEST_USER.password,
  }
}
