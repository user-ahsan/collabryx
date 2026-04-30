import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // Wait for form to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.locator('#login-heading')).toBeVisible()
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByPlaceholder('m@example.com').fill('invalid-email')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click()

    await expect(page).toHaveURL('/register')
  })

  test('should show social login buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in with Apple' })).toBeVisible()
  })
})
