/**
 * Unified API response type for all layers (services, actions, API routes)
 */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string; details?: unknown }

/**
 * Helper to create success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

/**
 * Helper to create error response
 */
export function errorResponse(error: string, code?: string, details?: unknown): ApiResponse<never> {
  return { success: false, error, code, details }
}
