import { z } from "zod"

// ===========================================
// ONBOARDING VALIDATION SCHEMAS
// ===========================================

export const onboardingLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required").max(50),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
})

export const onboardingExperienceSchema = z.object({
  title: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
})

export const onboardingDataSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  
  headline: z
    .string()
    .min(5, "Headline must be at least 5 characters")
    .max(200, "Headline must be less than 200 characters"),
  
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  
  skills: z
    .array(z.string().min(1).max(50))
    .min(1, "At least one skill is required")
    .max(20, "Maximum 20 skills allowed"),
  
  interests: z
    .array(z.string().min(1).max(50))
    .min(1, "At least one interest is required")
    .max(30, "Maximum 30 interests allowed"),
  
  goals: z
    .array(z.string().min(1).max(100))
    .max(10, "Maximum 10 goals allowed")
    .optional(),
  
  experiences: z
    .array(onboardingExperienceSchema)
    .max(10, "Maximum 10 experiences allowed")
    .optional(),
  
  links: z
    .array(onboardingLinkSchema)
    .max(5, "Maximum 5 links allowed")
    .optional(),
})

export const completionPercentageSchema = z
  .number()
  .min(0, "Percentage must be at least 0")
  .max(100, "Percentage must be at most 100")

// ===========================================
// TYPE EXPORTS
// ===========================================

export type OnboardingData = z.infer<typeof onboardingDataSchema>
export type OnboardingLink = z.infer<typeof onboardingLinkSchema>
export type OnboardingExperience = z.infer<typeof onboardingExperienceSchema>

// ===========================================
// VALIDATION HELPER
// ===========================================

/**
 * Validates onboarding data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateOnboardingData(
  rawData: unknown
): { success: true; data: OnboardingData } | { success: false; errors: string[] } {
  const result = onboardingDataSchema.safeParse(rawData)
  
  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      const path = err.path.join(".")
      const message = err.message
      return path ? `${path}: ${message}` : message
    })
    return { success: false, errors }
  }
  
  return { success: true, data: result.data }
}
