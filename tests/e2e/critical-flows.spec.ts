import { test, expect } from '@playwright/test'

test.describe('Critical User Flows - P0-21', () => {
  test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('should display login form correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page.getByText(/email/i)).toBeVisible()
      await expect(page.getByText(/password/i)).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.getByPlaceholder(/email/i).fill('invalid-email')
      await page.getByPlaceholder(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page.getByText(/valid email/i)).toBeVisible()
    })

    test('should navigate to register page', async ({ page }) => {
      await page.getByRole('link', { name: /sign up/i }).click()
      await expect(page).toHaveURL('/register')
    })

    test('should show social login buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
    })
  })

  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should display registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
      await expect(page.getByPlaceholder(/name/i)).toBeVisible()
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).click()
      await expect(page.getByText(/name/i)).toBeVisible()
      await expect(page.getByText(/email/i)).toBeVisible()
      await expect(page.getByText(/password/i)).toBeVisible()
    })

    test('should navigate to login page', async ({ page }) => {
      await page.getByRole('link', { name: /sign in/i }).click()
      await expect(page).toHaveURL('/login')
    })

    test('should show password requirements', async ({ page }) => {
      await page.getByPlaceholder(/password/i).focus()
      await expect(page.getByText(/password/i)).toBeVisible()
    })
  })

  test.describe('Post Creation Flow', () => {
    test('should display post creation form in dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('textbox')).toBeVisible()
      await expect(page.getByRole('button', { name: /post/i })).toBeVisible()
    })

    test('should show character count', async ({ page }) => {
      await page.goto('/dashboard')
      const textbox = page.getByRole('textbox')
      await textbox.fill('Test post content')
      await expect(page.getByText(/characters/i)).toBeVisible()
    })

    test('should enable post button when content is entered', async ({ page }) => {
      await page.goto('/dashboard')
      const textbox = page.getByRole('textbox')
      await textbox.fill('Test post content')
      await expect(page.getByRole('button', { name: /post/i })).toBeEnabled()
    })
  })

  test.describe('Messaging Flow', () => {
    test('should display messages page', async ({ page }) => {
      await page.goto('/messages')
      await expect(page).toHaveURL('/messages')
      await expect(page.getByRole('heading', { name: /message/i })).toBeVisible()
    })

    test('should show message input field', async ({ page }) => {
      await page.goto('/messages')
      await expect(page.getByPlaceholder(/type a message/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /send/i })).toBeVisible()
    })

    test('should display conversation list', async ({ page }) => {
      await page.goto('/messages')
      await expect(page.getByRole('list')).toBeVisible()
    })
  })

  test.describe('Match Generation Flow', () => {
    test('should display matches page', async ({ page }) => {
      await page.goto('/matches')
      await expect(page).toHaveURL('/matches')
      await expect(page.getByRole('heading', { name: /match/i })).toBeVisible()
    })

    test('should show match cards or empty state', async ({ page }) => {
      await page.goto('/matches')
      const hasMatches = await page.getByRole('list').isVisible().catch(() => false)
      const hasEmptyState = await page.getByText(/no matches/i).isVisible().catch(() => false)
      expect(hasMatches || hasEmptyState).toBeTruthy()
    })

    test('should display match percentage', async ({ page }) => {
      await page.goto('/matches')
      const hasPercentage = await page.getByText(/%/).isVisible().catch(() => false)
      expect(hasPercentage).toBeTruthy()
    })
  })

  test.describe('Navigation Flow', () => {
    test('should navigate between main sections', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Navigate to matches
      await page.getByRole('link', { name: /match/i }).click()
      await expect(page).toHaveURL('/matches')
      
      // Navigate to messages
      await page.getByRole('link', { name: /message/i }).click()
      await expect(page).toHaveURL('/messages')
      
      // Navigate to dashboard
      await page.getByRole('link', { name: /dashboard/i }).click()
      await expect(page).toHaveURL('/dashboard')
    })

    test('should display sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('navigation')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    })
  })
})
