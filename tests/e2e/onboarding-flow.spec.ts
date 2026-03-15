import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('should display onboarding steps', async ({ page }) => {
    await page.goto('/onboarding')

    await expect(page.getByRole('heading')).toBeVisible()
    await expect(page.getByText('Complete your profile')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText('Required')).toBeVisible()
  })

  test('should progress through onboarding steps', async ({ page }) => {
    await page.goto('/onboarding')

    // Fill in basic info
    await page.getByLabel('Display name').fill('Test User')
    await page.getByLabel('Headline').fill('Software Developer')

    await page.getByRole('button', { name: 'Continue' }).click()

    // Add skills
    await page.getByPlaceholder('Add a skill').fill('React')
    await page.keyboard.press('Enter')

    await page.getByRole('button', { name: 'Continue' }).click()

    // Complete onboarding
    await expect(page).toHaveURL(/dashboard|profile/)
  })
})
