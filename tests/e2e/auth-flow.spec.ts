import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('Password')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByPlaceholder('m@example.com').fill('invalid-email')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('valid email')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click()

    await expect(page).toHaveURL('/register')
  })

  test('should show social login buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apple' })).toBeVisible()
  })
})
