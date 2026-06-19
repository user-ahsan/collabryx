import { z } from "zod"

// ===========================================
// ONBOARDING VALIDATION SCHEMAS — Role-Based
// ===========================================

// --- Shared base schemas ---

export const onboardingLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required").max(50),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
})

export const onboardingExperienceSchema = z.object({
  title: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
})

// --- Role definitions ---

export const ROLES = ['student', 'investor', 'founder', 'professional', 'mentor'] as const
export type OnboardingRole = (typeof ROLES)[number]

export const ROLE_LABELS: Record<OnboardingRole, string> = {
  student: 'Student',
  investor: 'Investor',
  founder: 'Founder',
  professional: 'Professional',
  mentor: 'Mentor',
}

export const ROLE_DESCRIPTIONS: Record<OnboardingRole, string> = {
  student: 'Looking for project teams, hackathons, or study groups',
  investor: 'Seeking startups to fund, mentor, or advise',
  founder: 'Building a startup — need co-founders, team, or funding',
  professional: 'Experienced professional open to new opportunities or mentoring',
  mentor: 'Want to guide and support the next generation',
}

export const ROLE_ICONS: Record<OnboardingRole, string> = {
  student: 'GraduationCap',
  investor: 'ChartLine',
  founder: 'Rocket',
  professional: 'Briefcase',
  mentor: 'Star',
}

// --- Role-specific schemas ---

export const studentSchema = z.object({
  university: z.string().max(200).optional().or(z.literal("")),
  major: z.string().max(200).optional().or(z.literal("")),
  graduation_year: z
    .number()
    .int()
    .min(2024, "Graduation year must be 2024 or later")
    .max(2040, "Graduation year must be 2040 or earlier")
    .optional()
    .nullable(),
  looking_for_team: z.boolean().optional(),
  project_interests: z.array(z.string().min(1).max(50)).max(10).optional(),
})

export const investorSchema = z.object({
  check_size_min: z
    .number()
    .min(0, "Minimum check size must be 0 or more")
    .max(100_000_000, "Maximum check size is $100M")
    .optional()
    .nullable(),
  check_size_max: z
    .number()
    .min(0, "Maximum check size must be 0 or more")
    .max(100_000_000, "Maximum check size is $100M")
    .optional()
    .nullable(),
  stage_focus: z
    .array(z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'late_stage']))
    .min(1, "Select at least one stage focus")
    .optional(),
  sectors: z.array(z.string().min(1).max(50)).max(10, "Maximum 10 sectors").optional(),
  portfolio_url: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
  investment_history_count: z.number().int().min(0).optional(),
  accredited_investor: z.boolean().optional(),
})

export const founderSchema = z.object({
  company_name: z.string().max(200).optional().or(z.literal("")),
  company_stage: z
    .enum(['idea', 'pre_seed', 'seed', 'early', 'growth', 'established'])
    .optional()
    .nullable(),
  company_role: z.string().max(200).optional().or(z.literal("")),
  team_size: z.number().int().min(1, "Team size must be at least 1").max(10000).optional().nullable(),
  fundraising_stage: z
    .enum(['not_raising', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus'])
    .optional()
    .nullable(),
  hiring_needs: z.array(z.string().min(1).max(100)).max(20, "Maximum 20 hiring needs").optional(),
  open_to_mentoring: z.boolean().optional(),
})

export const professionalSchema = z.object({
  company_name: z.string().max(200).optional().or(z.literal("")),
  company_role: z.string().max(200).optional().or(z.literal("")),
  open_to_mentoring: z.boolean().optional(),
})

export const mentorSchema = z.object({
  mentoring_areas: z
    .array(z.string().min(1).max(50))
    .min(1, "Select at least one mentoring area")
    .max(10, "Maximum 10 mentoring areas")
    .optional(),
  mentoring_format: z.enum(['one_on_one', 'group', 'async', 'any']).optional().nullable(),
  mentoring_availability_hours: z
    .number()
    .int()
    .min(0, "Hours must be 0 or more")
    .max(168, "Hours cannot exceed 168 (24/7)")
    .optional()
    .nullable(),
})

// --- Role selection schema ---

export const roleSelectionSchema = z.object({
  roles: z
    .array(z.enum(ROLES))
    .min(1, "Select at least one role that describes you"),
})

export type RoleSelectionData = z.infer<typeof roleSelectionSchema>

// ===========================================
// COMBINED ONBOARDING SCHEMA
// ===========================================
// This validates the complete onboarding form data
// Role-specific fields are conditionally validated

export const onboardingDataSchema = z.object({
  // --- Base fields (always collected) ---
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),

  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  headline: z
    .string()
    .min(5, "Headline must be at least 5 characters")
    .max(200, "Headline must be less than 200 characters"),

  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),

  avatarUrl: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .or(z.literal("")),

  bio: z
    .string()
    .max(2000, "Bio must be less than 2000 characters")
    .optional()
    .or(z.literal("")),

  collaborationReadiness: z
    .enum(["available", "open", "not-available"])
    .optional(),

  // --- Roles ---
  roles: z
    .array(z.enum(ROLES))
    .min(1, "Select at least one role"),

  // --- Role-specific fields (all optional at top level — validated per-role in actions) ---
  university: z.string().max(200).optional().or(z.literal("")),
  major: z.string().max(200).optional().or(z.literal("")),
  graduation_year: z.number().int().min(2024).max(2040).optional().nullable(),
  looking_for_team: z.boolean().optional(),
  project_interests: z.array(z.string().min(1).max(50)).max(10).optional(),

  check_size_min: z.number().min(0).max(100_000_000).optional().nullable(),
  check_size_max: z.number().min(0).max(100_000_000).optional().nullable(),
  stage_focus: z.array(z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'late_stage'])).optional(),
  sectors: z.array(z.string().min(1).max(50)).max(10).optional(),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  investment_history_count: z.number().int().min(0).optional(),
  accredited_investor: z.boolean().optional(),

  company_name: z.string().max(200).optional().or(z.literal("")),
  company_stage: z.enum(['idea', 'pre_seed', 'seed', 'early', 'growth', 'established']).optional().nullable(),
  company_role: z.string().max(200).optional().or(z.literal("")),
  team_size: z.number().int().min(1).max(10000).optional().nullable(),
  fundraising_stage: z.enum(['not_raising', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus']).optional().nullable(),
  hiring_needs: z.array(z.string().min(1).max(100)).max(20).optional(),
  open_to_mentoring: z.boolean().optional(),

  mentoring_areas: z.array(z.string().min(1).max(50)).max(10).optional(),
  mentoring_format: z.enum(['one_on_one', 'group', 'async', 'any']).optional().nullable(),
  mentoring_availability_hours: z.number().int().min(0).max(168).optional().nullable(),

  // --- Cross-category fields ---
  skills: z.array(z.object({
    id: z.string(),
    label: z.string(),
    proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"])
  })).min(5, "At least 5 skills are required").max(20, "Maximum 20 skills allowed"),

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

// Infer the full type
export type OnboardingData = z.infer<typeof onboardingDataSchema>
export type OnboardingLink = z.infer<typeof onboardingLinkSchema>
export type OnboardingExperience = z.infer<typeof onboardingExperienceSchema>

// ===========================================
// COMPLETION PERCENTAGE
// ===========================================

export const completionPercentageSchema = z
  .number()
  .min(0, "Percentage must be at least 0")
  .max(100, "Percentage must be at most 100")

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Validates onboarding data with Zod schema
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

/**
 * Get the role-specific validation schema for a given role
 */
export function getRoleSchema(role: OnboardingRole) {
  switch (role) {
    case 'student': return studentSchema;
    case 'investor': return investorSchema;
    case 'founder': return founderSchema;
    case 'professional': return professionalSchema;
    case 'mentor': return mentorSchema;
  }
}

/**
 * Returns the relevant role-specific fields for a user's selected roles
 */
export function getRoleFieldDescriptions(roles: OnboardingRole[]): string[] {
  const descriptions: string[] = []
  for (const role of roles) {
    switch (role) {
      case 'student':
        descriptions.push('University, major, and project interests')
        break
      case 'investor':
        descriptions.push('Investment preferences, check size, and focus sectors')
        break
      case 'founder':
        descriptions.push('Company details, team size, and hiring needs')
        break
      case 'professional':
        descriptions.push('Current role and mentoring preferences')
        break
      case 'mentor':
        descriptions.push('Mentoring areas, format, and availability')
        break
    }
  }
  return descriptions
}
