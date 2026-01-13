import { test, expect } from '@playwright/test'

test('user can login successfully', async ({ page }) => {
  await page.goto('/login')
  
  // Fill in the login form
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  
  // Click the submit button
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  
  // Verify URL is /dashboard
  expect(page.url()).toContain('/dashboard')
  
  // Verify user name appears in header
  const userName = await page.locator('header .text-sm.font-medium.text-gray-900').textContent()
  expect(userName).toContain('Test User')
})
