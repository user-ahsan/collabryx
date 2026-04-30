import { test as setup, expect } from '@playwright/test'

/**
 * Global setup for E2E tests
 * Handles authentication state and test isolation
 */
export default async function globalSetup(config: { baseURL?: string }) {
  // No global auth setup needed - tests handle their own auth state
  // This is a placeholder for future auth setup if needed
}
