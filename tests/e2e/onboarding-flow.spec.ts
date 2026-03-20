import { test, expect, type Page } from '@playwright/test'

test.describe('Onboarding Flow - Complete E2E Tests', () => {
  // Helper function to fill basic info
  async function fillBasicInfo(page: Page) {
    await page.getByLabel('Full Name *').fill('John Doe')
    await page.getByLabel('Display Name (Optional)').fill('johndoe')
    await page.getByLabel('Headline *').fill('Software Developer @ TechCorp')
    await page.getByLabel('Location (Optional)').fill('San Francisco, CA')
  }

  // Helper function to add skills
  async function addSkills(page: Page, skills: string[]) {
    for (const skill of skills) {
      const combobox = page.getByPlaceholder(/search skills/i)
      await combobox.fill(skill)
      await combobox.press('Enter')
    }
  }

  // Helper function to add interests
  async function addInterests(page: Page, interests: string[]) {
    for (const interest of interests) {
      const combobox = page.getByPlaceholder(/search interests/i)
      await combobox.fill(interest)
      await combobox.press('Enter')
    }
  }

  test.describe('Welcome Step', () => {
    test('should display welcome screen with heading', async ({ page }) => {
      await page.goto('/onboarding')

      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
      await expect(page.getByText(/let's get started/i)).toBeVisible()
    })

    test('should progress from welcome to basic info on Continue', async ({ page }) => {
      await page.goto('/onboarding')

      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.getByRole('heading', { name: /your skills/i })).toBeVisible()
      await expect(page.getByText('Hey')).toBeVisible()
    })
  })

  test.describe('Basic Info Step - Validation', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Try to continue without filling anything
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Full name is required')).toBeVisible()
      await expect(page.getByText('Headline is required')).toBeVisible()
    })

    test('should validate full name minimum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('J')
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
    })

    test('should validate full name maximum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      const longName = 'A'.repeat(101)
      await page.getByLabel('Full Name *').fill(longName)
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Full name must be less than 100 characters')).toBeVisible()
    })

    test('should validate full name format (letters and spaces only)', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('John123')
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Name can only contain letters and spaces')).toBeVisible()
    })

    test('should validate headline minimum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('John Doe')
      await page.getByLabel('Headline *').fill('Dev')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Headline must be at least 5 characters')).toBeVisible()
    })

    test('should validate headline maximum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      const longHeadline = 'A'.repeat(101)
      await page.getByLabel('Full Name *').fill('John Doe')
      await page.getByLabel('Headline *').fill(longHeadline)
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Headline must be less than 100 characters')).toBeVisible()
    })

    test('should validate display name format', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('John Doe')
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByLabel('Display Name (Optional)').fill('JohnDoe') // uppercase not allowed
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Display name can only contain lowercase')).toBeVisible()
    })

    test('should accept valid basic info', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Should move to next step without errors
      await expect(page.getByRole('heading', { name: /your skills/i })).toBeVisible()
    })
  })

  test.describe('Skills Step - Validation', () => {
    test('should require at least one skill', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Try to continue without adding skills
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Please add at least one skill')).toBeVisible()
    })

    test('should allow adding multiple skills', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      await addSkills(page, ['React', 'TypeScript'])

      await expect(page.getByText('React')).toBeVisible()
      await expect(page.getByText('TypeScript')).toBeVisible()
    })

    test('should allow proceeding after adding skills', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByRole('heading', { name: /interests/i })).toBeVisible()
    })
  })

  test.describe('Interests & Goals Step - Validation', () => {
    test('should require at least one interest', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Try to continue without adding interests
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Please add at least one interest')).toBeVisible()
    })

    test('should allow adding multiple interests', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await addInterests(page, ['AI', 'Web Development'])

      await expect(page.getByText('AI')).toBeVisible()
      await expect(page.getByText('Web Development')).toBeVisible()
    })
  })

  test.describe('Experience Step - Optional', () => {
    test('should allow skipping experience', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Experience step should be visible
      await expect(page.getByRole('heading', { name: /experience/i })).toBeVisible()

      // Skip & Complete should work
      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Should show loading dialog
      await expect(page.getByText('Completing Your Profile')).toBeVisible()
    })

    test('should allow adding experience', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await page.getByRole('button', { name: 'Add Experience' }).click()

      await expect(page.getByPlaceholder(/e\.g\. techstart inc\./i)).toBeVisible()
    })

    test('should allow adding portfolio links', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await page.getByRole('button', { name: 'Add Link' }).click()
      await page.getByRole('menuitem', { name: /github/i }).click()

      await expect(page.getByPlaceholder(/https:\/\/github\.com\/username/i)).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate back and preserve data', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Go back
      await page.getByRole('button', { name: 'Back' }).click()

      // Skills should still be there
      await expect(page.getByText('React')).toBeVisible()

      // Go back again
      await page.getByRole('button', { name: 'Back' }).click()

      // Basic info should still be filled
      await expect(page.getByLabel('Full Name *')).toHaveValue('John Doe')
    })

    test('should disable back button on first step', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      const backButton = page.getByRole('button', { name: 'Back' })
      await expect(backButton).toBeDisabled()
    })

    test('should show stepper with current step highlighted', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Stepper should be visible
      await expect(page.getByRole('navigation', { name: /progress/i })).toBeVisible()

      // Basic Info should be current step
      await expect(page.getByText('Basic Info').first()).toHaveClass(/text-foreground/)
    })

    test('should show completed steps with checkmarks', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Basic Info should have checkmark
      const checkmarkIcon = page.locator('svg').first()
      await expect(checkmarkIcon).toBeVisible()
    })
  })

  test.describe('Form Persistence', () => {
    test('should persist form data to sessionStorage', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Check sessionStorage
      const sessionStorageData = await page.evaluate(() => {
        return sessionStorage.getItem('onboarding_draft')
      })

      expect(sessionStorageData).toBeTruthy()
      const parsed = JSON.parse(sessionStorageData!)
      expect(parsed.values.fullName).toBe('John Doe')
    })

    test('should restore form data from sessionStorage on reload', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])

      // Reload page
      await page.reload()

      // Wait for restoration
      await page.waitForTimeout(1000)

      // Should restore to skills step with data
      await expect(page.getByText('React')).toBeVisible()
    })

    test('should clear sessionStorage on successful completion', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Mock successful submission
      await page.route('**/api/**', route => route.fulfill({
        status: 200,
        json: { success: true, userId: 'test-123' },
      }))

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Wait for completion
      await page.waitForTimeout(2000)

      // sessionStorage should be cleared
      const sessionStorageData = await page.evaluate(() => {
        return sessionStorage.getItem('onboarding_draft')
      })

      expect(sessionStorageData).toBeNull()
    })
  })

  test.describe('Unsaved Changes Warning', () => {
    test('should warn before leaving page with unsaved changes', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)

      // Try to navigate away
      let confirmed = false
      page.on('dialog', async dialog => {
        confirmed = true
        await dialog.dismiss()
      })

      await page.evaluate(() => window.location.href = '/dashboard')

      // Should have triggered beforeunload dialog
      expect(confirmed).toBe(true)
    })
  })

  test.describe('Loading States', () => {
    test('should show loading dialog during submission', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Mock slow submission
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          json: { success: true, userId: 'test-123' },
        })
      })

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Loading dialog should appear
      await expect(page.getByText('Completing Your Profile')).toBeVisible()
      await expect(page.getByRole('progressbar')).toBeVisible()
    })

    test('should show progress percentage in loading dialog', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await page.route('**/api/**', route => route.fulfill({
        status: 200,
        json: { success: true, userId: 'test-123' },
      }))

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Should show progress percentage
      await expect(page.getByText(/90%/)).toBeVisible()
    })

    test('should disable buttons during submission', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          json: { success: true, userId: 'test-123' },
        })
      })

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Buttons should be disabled
      await expect(page.getByRole('button', { name: 'Skip & Complete' })).toBeDisabled()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error message on submission failure', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Mock failed submission
      await page.route('**/api/**', route => route.fulfill({
        status: 500,
        json: { error: 'Submission failed' },
      }))

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Should show error toast
      await expect(page.getByText(/failed to complete onboarding/i)).toBeVisible()
    })

    test('should allow retry after network error', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React'])
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addInterests(page, ['AI'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      let attemptCount = 0
      await page.route('**/api/**', route => {
        attemptCount++
        if (attemptCount === 1) {
          route.fulfill({ status: 500 })
        } else {
          route.fulfill({
            status: 200,
            json: { success: true, userId: 'test-123' },
          })
        }
      })

      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Wait for error
      await page.waitForTimeout(1000)

      // Should be able to retry
      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Second attempt should succeed
      await expect(page.getByText(/profile setup complete/i)).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have skip link for keyboard users', async ({ page }) => {
      await page.goto('/onboarding')

      const skipLink = page.locator('a[href="#onboarding-main-content"]')
      await expect(skipLink).toBeVisible()
    })

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/onboarding')

      // Tab through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Focused element should have visible focus ring
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should announce step changes to screen readers', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Should have live region for announcements
      const liveRegion = page.locator('[aria-live="polite"]').first()
      await expect(liveRegion).toBeVisible()
    })

    test('should have proper ARIA labels on icon buttons', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Back button should have aria-label
      const backButton = page.getByRole('button', { name: 'Go to previous step' })
      await expect(backButton).toBeVisible()
    })

    test('should have proper form field labels', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      const fullNameInput = page.getByLabel('Full Name *')
      await expect(fullNameInput).toBeVisible()

      const headlineInput = page.getByLabel('Headline *')
      await expect(headlineInput).toBeVisible()
    })

    test('should announce validation errors to screen readers', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Error messages should have role="alert"
      const alertMessages = page.locator('[role="alert"]')
      await expect(alertMessages.first()).toBeVisible()
    })

    test('should support keyboard navigation through form', async ({ page }) => {
      await page.goto('/onboarding')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Should be able to tab through all fields
      await page.keyboard.press('Tab') // Full name
      await page.keyboard.press('Tab') // Display name
      await page.keyboard.press('Tab') // Headline
      await page.keyboard.press('Tab') // Location
      await page.keyboard.press('Tab') // Next button

      // Should be on Next button
      const nextButton = page.getByRole('button', { name: 'Next Step' })
      await expect(nextButton).toBeFocused()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/onboarding')

      await expect(page.getByRole('heading')).toBeVisible()
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Should work on mobile
      await expect(page.getByRole('heading', { name: /your skills/i })).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/onboarding')

      await expect(page.getByRole('heading')).toBeVisible()
    })

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/onboarding')

      await expect(page.getByRole('heading')).toBeVisible()
    })
  })

  test.describe('Complete Flow', () => {
    test('should complete full onboarding flow successfully', async ({ page }) => {
      await page.goto('/onboarding')

      // Welcome step
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
      await page.getByRole('button', { name: 'Continue' }).click()

      // Basic Info
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Skills
      await addSkills(page, ['React', 'TypeScript', 'Node.js'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Interests
      await addInterests(page, ['AI', 'Web Development'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Experience (skip)
      await page.getByRole('button', { name: 'Skip & Complete' }).click()

      // Wait for completion
      await page.waitForTimeout(2000)

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/)
    })
  })
})
