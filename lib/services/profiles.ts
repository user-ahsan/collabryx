import { createClient } from "@/lib/supabase/client"
import type { Profile, UserSkill, UserInterest, UserExperience, UserProject } from "@/types/database.types"

// ===========================================
// PROFILE SERVICE
// ===========================================

export interface ProfileWithDetails extends Profile {
  skills?: UserSkill[]
  interests?: UserInterest[]
  experiences?: UserExperience[]
  projects?: UserProject[]
}

/**
 * Fetch the current user's profile with details
 */
export async function fetchCurrentProfile(): Promise<{
  data: ProfileWithDetails | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        skills:user_skills(*),
        interests:user_interests(*),
        experiences:user_experiences(*),
        projects:user_projects(*)
      `)
      .eq("id", user.id)
      .single()

    if (error) throw error

    const profile: ProfileWithDetails = {
      ...data,
      skills: data.skills || [],
      interests: data.interests || [],
      experiences: data.experiences || [],
      projects: data.projects || [],
    }

    return { data: profile, error: null }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Fetch a user's profile by ID
 */
export async function fetchProfileById(userId: string): Promise<{
  data: ProfileWithDetails | null
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        skills:user_skills(*),
        interests:user_interests(*),
        experiences:user_experiences(*),
        projects:user_projects(*)
      `)
      .eq("id", userId)
      .single()

    if (error) throw error

    const profile: ProfileWithDetails = {
      ...data,
      skills: data.skills || [],
      interests: data.interests || [],
      experiences: data.experiences || [],
      projects: data.projects || [],
    }

    return { data: profile, error: null }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// USER SKILLS SERVICE
// ===========================================

export async function fetchUserSkills(userId: string): Promise<{
  data: UserSkill[]
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_skills")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching skills:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function addSkill(
  skill: Pick<UserSkill, "skill_name" | "proficiency" | "is_primary">
): Promise<{ data: UserSkill | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("user_skills")
      .insert({
        user_id: user.id,
        skill_name: skill.skill_name,
        proficiency: skill.proficiency,
        is_primary: skill.is_primary || false,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding skill:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeSkill(skillId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    const { error } = await supabase
      .from("user_skills")
      .delete()
      .eq("id", skillId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error removing skill:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// USER INTERESTS SERVICE
// ===========================================

export async function fetchUserInterests(userId: string): Promise<{
  data: UserInterest[]
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching interests:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function addInterest(
  interest: string
): Promise<{ data: UserInterest | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("user_interests")
      .upsert({
        user_id: user.id,
        interest,
      }, { onConflict: "user_id,interest" })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding interest:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeInterest(
  interest: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    const { error } = await supabase
      .from("user_interests")
      .delete()
      .eq("user_id", user.id)
      .eq("interest", interest)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error removing interest:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// USER EXPERIENCES SERVICE
// ===========================================

export async function fetchUserExperiences(userId: string): Promise<{
  data: UserExperience[]
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_experiences")
      .select("*")
      .eq("user_id", userId)
      .order("order_index", { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching experiences:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function addExperience(
  experience: Omit<UserExperience, "id" | "user_id" | "created_at">
): Promise<{ data: UserExperience | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("user_experiences")
      .insert({
        user_id: user.id,
        title: experience.title,
        company: experience.company,
        description: experience.description,
        start_date: experience.start_date,
        end_date: experience.end_date,
        is_current: experience.is_current,
        order_index: experience.order_index,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding experience:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeExperience(experienceId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    const { error } = await supabase
      .from("user_experiences")
      .delete()
      .eq("id", experienceId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error removing experience:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// USER PROJECTS SERVICE
// ===========================================

export async function fetchUserProjects(userId: string): Promise<{
  data: UserProject[]
  error: Error | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("order_index", { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching projects:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function addProject(
  project: Omit<UserProject, "id" | "user_id" | "created_at">
): Promise<{ data: UserProject | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error("Not authenticated") }
    }

    const { data, error } = await supabase
      .from("user_projects")
      .insert({
        user_id: user.id,
        title: project.title,
        description: project.description,
        url: project.url,
        image_url: project.image_url,
        tech_stack: project.tech_stack,
        is_public: project.is_public,
        order_index: project.order_index,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error("Error adding project:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

export async function removeProject(projectId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error("Not authenticated") }
    }

    const { error } = await supabase
      .from("user_projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error removing project:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}
