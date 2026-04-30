import { test, expect, type Page } from '@playwright/test'

test.describe('Onboarding Flow - Complete E2E Tests', () => {
  // Helper function to fill basic info
  async function fillBasicInfo(page: Page) {
    await page.getByLabel('Full Name *').fill('John Doe')
    await page.getByLabel('Display Name (Optional)').fill('johndoe')
    await page.getByLabel('Headline *').fill('Software Developer at TechCorp')
    await page.getByLabel('Location (Optional)').fill('San Francisco, CA')
  }

  // Helper function to add skills with proficiency
  async function addSkills(page: Page, skills: string[]) {
    for (const skill of skills) {
      const combobox = page.getByPlaceholder(/search skills/i)
      await combobox.fill(skill)
      await page.waitForTimeout(200) // Wait for dropdown
      await combobox.press('Enter')
      await page.waitForTimeout(100)
      
      // Select proficiency level if prompted
      const proficiencyButton = page.getByRole('button', { name: /^(beginner|intermediate|advanced|expert)$/i })
      if (await proficiencyButton.isVisible().catch(() => false)) {
        await proficiencyButton.first().click()
      }
    }
  }

  // Helper function to add interests
  async function addInterests(page: Page, interests: string[]) {
    for (const interest of interests) {
      const combobox = page.getByPlaceholder(/search interests/i)
      await combobox.fill(interest)
      await page.waitForTimeout(200)
      await combobox.press('Enter')
      await page.waitForTimeout(100)
    }
  }

  test.describe('Welcome Step', () => {
    test('should display welcome screen with heading', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    })

    test('should progress from welcome to basic info on Continue', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.getByRole('heading', { name: /your basic info/i })).toBeVisible()
    })
  })

  test.describe('Basic Info Step - Validation', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Try to continue without filling anything
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Full name is required')).toBeVisible()
      await expect(page.getByText('Headline is required')).toBeVisible()
    })

    test('should validate full name minimum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('J')
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible()
    })

    test('should validate full name maximum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      const longName = 'A'.repeat(101)
      await page.getByLabel('Full Name *').fill(longName)
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Full name must be less than 100 characters')).toBeVisible()
    })

    test('should validate full name format (letters and spaces only)', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('John123')
      await page.getByLabel('Headline *').fill('Developer')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Name can only contain letters and spaces')).toBeVisible()
    })

    test('should validate headline minimum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByLabel('Full Name *').fill('John Doe')
      await page.getByLabel('Headline *').fill('Dev')
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Headline must be at least 5 characters')).toBeVisible()
    })

    test('should validate headline maximum length', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      const longHeadline = 'A'.repeat(101)
      await page.getByLabel('Full Name *').fill('John Doe')
      await page.getByLabel('Headline *').fill(longHeadline)
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Headline must be less than 100 characters')).toBeVisible()
    })

    test('should accept valid basic info', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Should move to next step without errors
      await expect(page.getByRole('heading', { name: /your skills/i })).toBeVisible()
    })
  })

  test.describe('Skills Step - Validation', () => {
    test('should require at least 5 skills', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Try to continue without adding skills
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Please add at least 5 skills')).toBeVisible()
    })

    test('should allow adding multiple skills', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Add 5 skills as required
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])

      // Verify skills are added (check for skill badges/chips)
      await expect(page.getByText('React')).toBeVisible()
      await expect(page.getByText('TypeScript')).toBeVisible()
    })

    test('should allow proceeding after adding skills', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByRole('heading', { name: /interests/i })).toBeVisible()
    })
  })

  test.describe('Interests & Goals Step - Validation', () => {
    test('should require at least one interest', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Try to continue without adding interests
      await page.getByRole('button', { name: 'Next Step' }).click()

      await expect(page.getByText('Please add at least one interest')).toBeVisible()
    })

    test('should allow adding multiple interests', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
      await page.getByRole('button', { name: 'Next Step' }).click()

      await addInterests(page, ['AI', 'Web Development'])

      await expect(page.getByText('AI')).toBeVisible()
      await expect(page.getByText('Web Development')).toBeVisible()
    })
  })

  test.describe('Experience Step - Optional', () => {
    test('should allow skipping experience', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
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
  })

  test.describe('Navigation', () => {
    test('should navigate back and preserve data', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
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
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      const backButton = page.getByRole('button', { name: 'Back' })
      await expect(backButton).toBeDisabled()
    })

    test('should show stepper with current step highlighted', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Stepper should be visible
      await expect(page.getByRole('navigation', { name: /progress/i })).toBeVisible()
    })
  })

  test.describe('Form Persistence', () => {
    test('should persist form data to sessionStorage', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
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

    test('should clear sessionStorage on successful completion', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
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

  test.describe('Loading States', () => {
    test('should show loading dialog during submission', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
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
  })

  test.describe('Error Handling', () => {
    test('should show error message on submission failure', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()
      await addSkills(page, ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML'])
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
  })

  test.describe('Accessibility', () => {
    test('should have skip link for keyboard users', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      const skipLink = page.locator('a[href="#onboarding-main-content"]')
      await expect(skipLink).toBeVisible()
    })

    test('should have proper form field labels', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Continue' }).click()

      const fullNameInput = page.getByLabel('Full Name *')
      await expect(fullNameInput).toBeVisible()

      const headlineInput = page.getByLabel('Headline *')
      await expect(headlineInput).toBeVisible()
    })

    test('should support keyboard navigation through form', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
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
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading')).toBeVisible()
      await page.getByRole('button', { name: 'Continue' }).click()
      await fillBasicInfo(page)
      await page.getByRole('button', { name: 'Next Step' }).click()

      // Should work on mobile
      await expect(page.getByRole('heading', { name: /your skills/i })).toBeVisible()
    })

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading')).toBeVisible()
    })
  })
})
