import { z } from "zod"

// ===========================================
// AUTHENTICATION VALIDATION SCHEMAS
// ===========================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
})

export const resetPasswordSchema = z.object({
  token: z.string().uuid("Invalid reset token."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

// ===========================================
// TYPE EXPORTS
// ===========================================

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Validates login data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateLogin(
  rawData: unknown
): { success: true; data: LoginData } | { success: false; errors: string[] } {
  const result = loginSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

/**
 * Validates registration data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateRegister(
  rawData: unknown
): { success: true; data: RegisterData } | { success: false; errors: string[] } {
  const result = registerSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

/**
 * Validates password reset data with Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateResetPassword(
  rawData: unknown
): { success: true; data: ResetPasswordData } | { success: false; errors: string[] } {
  const result = resetPasswordSchema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message)
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}

/**
 * Password strength requirements for UI validation
 */
export const passwordRequirements = [
  { label: "At least 8 characters", regex: /.{8,}/ },
  { label: "Contains uppercase letter", regex: /[A-Z]/ },
  { label: "Contains lowercase letter", regex: /[a-z]/ },
  { label: "Contains number", regex: /[0-9]/ },
  { label: "Contains special character", regex: /[^A-Za-z0-9]/ },
]

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength += 20
  if (password.length >= 12) strength += 10
  if (/[A-Z]/.test(password)) strength += 20
  if (/[a-z]/.test(password)) strength += 20
  if (/[0-9]/.test(password)) strength += 15
  if (/[^A-Za-z0-9]/.test(password)) strength += 15
  return Math.min(strength, 100)
}
