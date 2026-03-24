// ===========================================
// DEVELOPMENT MODE SERVICE
// ===========================================
// Provides test user and auto-completes onboarding in development
// Also provides debug logging utilities for development

import { createClient } from "@/lib/supabase/client"
import type { Profile, UserSkill, UserExperience, UserProject } from "@/types/database.types"

// ===========================================
// ENVIRONMENT CONFIGURATION
// ===========================================

/**
 * Normalize development mode value to handle different config formats
 * Accepts: "true", "testing", "development" (case-insensitive)
 */
const normalizeDevMode = (value: string | undefined): boolean => {
  if (!value) return false
  const normalized = value.toLowerCase().trim()
  return normalized === "true" || normalized === "testing" || normalized === "development"
}

const DEVELOPMENT_MODE = normalizeDevMode(process.env.DEVELOPMENT_MODE)
const DEBUG_ENABLED = process.env.DEBUG === "true" || process.env.DEBUG === "1"
const ENABLE_PERFORMANCE_LOGS = process.env.ENABLE_PERFORMANCE_LOGS === "true"
const LOG_LEVEL = process.env.LOG_LEVEL || "info"

const TEST_USER_EMAIL = "test123@collabryx.com"
const TEST_USER_PASSWORD = "test123"

// ===========================================
// MODULE INITIALIZATION LOGGING
// ===========================================

/**
 * Log development mode configuration on module load
 * This helps developers understand the current environment setup
 */
if (DEVELOPMENT_MODE || DEBUG_ENABLED) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           DEVELOPMENT MODE CONFIGURATION               ║
╠════════════════════════════════════════════════════════╣
║  NODE_ENV:          ${process.env.NODE_ENV?.padEnd(30)}║
║  DEVELOPMENT_MODE:  ${String(process.env.DEVELOPMENT_MODE)?.padEnd(30)}║
║  DEBUG:             ${String(process.env.DEBUG)?.padEnd(30)}║
║  LOG_LEVEL:         ${LOG_LEVEL.padEnd(30)}║
║  PERF_LOGS:         ${String(ENABLE_PERFORMANCE_LOGS).padEnd(30)}║
║                                                          ║
║  Dev Mode Active:   ${String(DEVELOPMENT_MODE).padEnd(30)}║
║  Debug Enabled:     ${String(DEBUG_ENABLED).padEnd(30)}║
╚════════════════════════════════════════════════════════╝
  `.trim())
}

// ===========================================
// ENVIRONMENT VALIDATION
// ===========================================

/**
 * Validate critical environment variables and warn about misconfigurations
 */
function validateEnvironment(): void {
  const warnings: string[] = []
  
  // Check DEVELOPMENT_MODE value
  const devModeValue = process.env.DEVELOPMENT_MODE
  if (devModeValue && !normalizeDevMode(devModeValue) && devModeValue.toLowerCase() !== "false") {
    warnings.push(`DEVELOPMENT_MODE="${devModeValue}" is not a recognized value. Use: "true", "testing", "development", or "false"`)
  }
  
  // Check for missing critical vars in development
  if (DEVELOPMENT_MODE && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }
  
  // Check DEBUG flag consistency
  if (DEBUG_ENABLED && LOG_LEVEL === "error") {
    warnings.push("DEBUG=true but LOG_LEVEL=error - debug logs will not appear")
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn("\n⚠️  Environment Configuration Warnings:")
    warnings.forEach(warning => console.warn(`   • ${warning}`))
    console.warn("")
  }
}

// Run validation on module load if in dev mode
if (DEVELOPMENT_MODE) {
  validateEnvironment()
}

// ===========================================
// DEBUG LOGGING UTILITIES
// ===========================================

/**
 * Check if debug logging is enabled
 * Uses DEBUG environment variable
 */
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED
}

/**
 * Check if performance logging is enabled
 * Uses ENABLE_PERFORMANCE_LOGS environment variable
 */
export function isPerformanceLogEnabled(): boolean {
  return ENABLE_PERFORMANCE_LOGS && DEBUG_ENABLED
}

/**
 * Categorized debug logging function
 * Only logs when DEBUG=true and log level allows it
 * 
 * @param category - Log category (e.g., "auth", "database", "api")
 * @param message - Log message
 * @param data - Optional data to log
 */
export function devLog(category: string, message: string, data?: unknown): void {
  if (!DEBUG_ENABLED) return
  
  const shouldLog = LOG_LEVEL === "debug" || LOG_LEVEL === "info"
  if (!shouldLog) return
  
  const timestamp = new Date().toISOString().split("T")[1].slice(0, -1)
  const prefix = `[${timestamp}] [DEV:${category.toUpperCase()}]`
  
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data)
  } else {
    console.log(`${prefix} ${message}`)
  }
}

/**
 * Performance timing logger
 * Returns a function to stop timing and log the duration
 * 
 * @param category - Performance category
 * @param label - Operation label
 * @returns Function to stop timing
 * 
 * @example
 * const stopTimer = performanceLog("auth", "getUser")
 * // ... do work ...
 * stopTimer()
 */
export function performanceLog(category: string, label: string): () => void {
  const startTime = performance.now()
  const timestamp = new Date().toISOString().split("T")[1].slice(0, -1)
  
  return () => {
    if (!isPerformanceLogEnabled()) return
    
    const duration = performance.now() - startTime
    const prefix = `[${timestamp}] [PERF:${category.toUpperCase()}]`
    const durationColor = duration > 1000 ? "🔴" : duration > 500 ? "🟡" : "🟢"
    
    console.log(`${prefix} ${label} completed in ${duration.toFixed(2)}ms ${durationColor}`)
  }
}

/**
 * Log email verification status for debugging
 * Specialized helper for auth flow debugging
 * 
 * @param userEmail - User's email address
 * @param emailConfirmedAt - The email_confirmed_at timestamp from Supabase
 * @param context - Additional context about where this check occurred
 */
export function logEmailVerificationStatus(
  userEmail: string | null | undefined,
  emailConfirmedAt: string | null | undefined,
  context: string = "email-verification"
): void {
  if (!DEBUG_ENABLED) return
  
  devLog(context, "Email verification status check", {
    userEmail,
    emailConfirmedAt,
    isVerified: !!emailConfirmedAt,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log redirect decisions for debugging
 * Helps track navigation flow in development
 * 
 * @param from - Current path
 * @param to - Target path
 * @param reason - Reason for redirect
 */
export function logRedirectDecision(
  from: string,
  to: string,
  reason: string
): void {
  if (!DEBUG_ENABLED) return
  
  devLog("routing", `Redirect: ${from} → ${to}`, {
    reason,
    timestamp: new Date().toISOString(),
  })
}

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
 * 
 * Returns true when DEVELOPMENT_MODE environment variable is set to:
 * - "true" (case-insensitive)
 * - "testing" (case-insensitive)
 * - "development" (case-insensitive)
 * 
 * @returns boolean indicating if development mode is active
 */
export function isDevelopmentMode(): boolean {
  return DEVELOPMENT_MODE
}

/**
 * Get current development configuration
 * Useful for debugging and environment checks
 * 
 * @returns Object with current dev mode configuration
 */
export function getDevelopmentConfig(): {
  isDevelopmentMode: boolean
  isDebugEnabled: boolean
  isPerformanceLogEnabled: boolean
  logLevel: string
  nodeEnv: string | undefined
  developmentModeValue: string | undefined
} {
  return {
    isDevelopmentMode: DEVELOPMENT_MODE,
    isDebugEnabled: DEBUG_ENABLED,
    isPerformanceLogEnabled: ENABLE_PERFORMANCE_LOGS,
    logLevel: LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV,
    developmentModeValue: process.env.DEVELOPMENT_MODE,
  }
}

/**
 * Get or create test user in development mode
 */
export async function getOrCreateTestUser(): Promise<{
  user: { id: string; email?: string } | null
  error: Error | null
  isNewUser: boolean
}> {
  const stopTimer = performanceLog("dev-mode", "getOrCreateTestUser")
  
  if (!isDevelopmentMode()) {
    return { user: null, error: null, isNewUser: false }
  }

  devLog("dev-mode", "Getting or creating test user", {
    email: TEST_USER_EMAIL,
    mode: process.env.DEVELOPMENT_MODE,
  })

  const supabase = createClient()

  try {
    // Try to sign in with test credentials
    const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (existingUser && !signInError) {
      devLog("dev-mode", "Signed in existing test user", {
        userId: existingUser.id,
        email: existingUser.email,
      })
      stopTimer()
      return { user: { id: existingUser.id, email: existingUser.email }, error: null, isNewUser: false }
    }

    // If sign in failed, try to sign up
    devLog("dev-mode", "Sign in failed, attempting signup", {
      signInError: signInError?.message || "Unknown error",
    })
    
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (signUpError) {
      console.error("[Dev Mode] Error signing up test user:", signUpError)
      devLog("dev-mode", "Signup failed", { error: signUpError })
      stopTimer()
      return { user: null, error: signUpError, isNewUser: false }
    }

    devLog("dev-mode", "Created new test user", {
      userId: newUser?.id,
      email: newUser?.email,
    })
    stopTimer()
    return { user: { id: newUser?.id || "", email: newUser?.email }, error: null, isNewUser: true }
  } catch {
    console.error("[Dev Mode] Error with test user:", error)
    devLog("dev-mode", "Unexpected error", { error })
    stopTimer()
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
  const stopTimer = performanceLog("dev-mode", "completeTestUserOnboarding")
  
  if (!isDevelopmentMode()) {
    return { success: false, error: null }
  }

  devLog("dev-mode", "Starting test user onboarding")

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    devLog("dev-mode", "Onboarding failed: No user found")
    stopTimer()
    return { success: false, error: new Error("No user found") }
  }

  devLog("dev-mode", "User found for onboarding", {
    userId: user.id,
    email: user.email,
  })

  try {
    // Upsert profile (will update if exists, create if not)
    devLog("dev-mode", "Upserting profile")
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email || TEST_USER.email,
        ...TEST_USER.profile,
      }, { onConflict: "id" })

    if (profileError) {
      console.error("[Dev Mode] Error upserting profile:", profileError)
      devLog("dev-mode", "Profile upsert failed", { error: profileError })
      stopTimer()
      return { success: false, error: profileError }
    }
    devLog("dev-mode", "Profile upserted successfully")

    // Upsert skills
    devLog("dev-mode", "Upserting skills", { count: TEST_USER.skills.length })
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
    devLog("dev-mode", "Upserting interests", { count: TEST_USER.interests.length })
    for (const interest of TEST_USER.interests) {
      await supabase
        .from("user_interests")
        .upsert({
          user_id: user.id,
          interest,
        }, { onConflict: "user_id,interest" })
    }

    // Upsert experiences
    devLog("dev-mode", "Upserting experiences", { count: TEST_USER.experiences.length })
    for (const exp of TEST_USER.experiences) {
      await supabase
        .from("user_experiences")
        .upsert({
          user_id: user.id,
          ...exp,
        }, { onConflict: "user_id,title" })
    }

    // Upsert projects
    devLog("dev-mode", "Upserting projects", { count: TEST_USER.projects.length })
    for (const project of TEST_USER.projects) {
      await supabase
        .from("user_projects")
        .upsert({
          user_id: user.id,
          ...project,
        }, { onConflict: "user_id,title" })
    }

    devLog("dev-mode", "Test user onboarding completed successfully")
    stopTimer()
    return { success: true, error: null }
  } catch {
    console.error("[Dev Mode] Error completing onboarding:", error)
    devLog("dev-mode", "Onboarding failed with error", { error })
    stopTimer()
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
