import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Collabryx/)
  })

  test('should have login button', async ({ page }) => {
    await page.goto('/')
    const loginButton = page.getByRole('button', { name: /login/i })
    await expect(loginButton).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Login/)
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/Register/)
  })
})
