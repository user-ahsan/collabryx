import { z } from "zod"

// ===========================================
// SETTINGS VALIDATION SCHEMAS
// ===========================================

export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name must be less than 50 characters.")
    .optional()
    .or(z.literal("")),
  
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be less than 100 characters."),
  
  headline: z
    .string()
    .min(2, "Headline must be at least 2 characters.")
    .max(200, "Headline must be less than 200 characters."),
  
  bio: z
    .string()
    .max(2000, "Bio must be less than 2000 characters.")
    .optional()
    .or(z.literal("")),
  
  location: z
    .string()
    .max(100, "Location must be less than 100 characters.")
    .optional()
    .or(z.literal("")),
  
  websiteUrl: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
})

export const skillSchema = z.object({
  skill_name: z
    .string()
    .min(1, "Skill cannot be empty.")
    .max(50, "Skill must be less than 50 characters."),
})

export const skillsSettingsSchema = z.object({
  skills: z
    .array(skillSchema)
    .min(1, "At least one skill is required.")
    .max(20, "Maximum 20 skills allowed."),
  
  interests: z
    .array(z.object({
      interest: z
        .string()
        .min(1, "Interest cannot be empty.")
        .max(50, "Interest must be less than 50 characters."),
    }))
    .max(30, "Maximum 30 interests allowed."),
})

export const experienceSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .max(100, "Title must be less than 100 characters.")
    .optional()
    .or(z.literal("")),
  
  company: z
    .string()
    .max(100, "Company must be less than 100 characters.")
    .optional()
    .or(z.literal("")),
  
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters.")
    .optional()
    .or(z.literal("")),
  
  start_date: z
    .string()
    .optional()
    .or(z.literal("")),
  
  is_current: z.boolean().optional(),
})

export const projectSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, "Project title is required.")
    .max(100, "Title must be less than 100 characters."),
  
  url: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
  
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters.")
    .optional()
    .or(z.literal("")),
  
  is_public: z.boolean().optional(),
})

export const experienceProjectsSettingsSchema = z.object({
  experiences: z
    .array(experienceSchema)
    .max(10, "Maximum 10 experiences allowed."),
  
  projects: z
    .array(projectSchema)
    .max(20, "Maximum 20 projects allowed."),
})

// ===========================================
// TYPE EXPORTS
// ===========================================

export type ProfileSettingsData = z.infer<typeof profileSettingsSchema>
export type SkillData = z.infer<typeof skillSchema>
export type SkillsSettingsData = z.infer<typeof skillsSettingsSchema>
export type ExperienceData = z.infer<typeof experienceSchema>
export type ProjectData = z.infer<typeof projectSchema>
export type ExperienceProjectsSettingsData = z.infer<typeof experienceProjectsSettingsSchema>

// ===========================================
// VALIDATION HELPERS
// ===========================================

export function validateProfileSettings(
  rawData: unknown
): { success: true; data: ProfileSettingsData } | { success: false; errors: string[] } {
  const result = profileSettingsSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

export function validateSkillsSettings(
  rawData: unknown
): { success: true; data: SkillsSettingsData } | { success: false; errors: string[] } {
  const result = skillsSettingsSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

export function validateExperienceProjectsSettings(
  rawData: unknown
): { success: true; data: ExperienceProjectsSettingsData } | { success: false; errors: string[] } {
  const result = experienceProjectsSettingsSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}
