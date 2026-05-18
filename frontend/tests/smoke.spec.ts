import { test, expect } from '@playwright/test';

test('smoke: home page loads and login form is accessible', async ({ page }) => {
  await page.goto('/');

  // Verify Landing Page
  await expect(page).toHaveTitle(/Candidate Portal/i);
  await expect(page.getByText(/Accelerate Your/i)).toBeVisible();

  // Navigate to Login
  await page.goto('/login');
  await expect(page.locator('input[placeholder="name@example.com"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
});
