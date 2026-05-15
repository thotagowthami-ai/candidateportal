import { test, expect } from '@playwright/test';

// 1) Home page loads
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Candidate Portal/i);
});

// 2) Login with real registered email -> redirects to resume page
test('login redirects to resume page', async ({ page }) => {
  await page.goto('/');

  // Navigate to login
  await page.click('text=Sign In');
  await expect(page).toHaveURL(/\/login/);

  // Fill login form
  await page.fill('input[placeholder="name@example.com"]', 'thotagowthami26@gmail.com');

  // Click Sign In
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to /resume
  await expect(page).toHaveURL(/resume/, { timeout: 10000 });

  // Verify resume page loaded
  await expect(page.getByText('Active Session', { exact: false })).toBeVisible({ timeout: 10000 });
});
