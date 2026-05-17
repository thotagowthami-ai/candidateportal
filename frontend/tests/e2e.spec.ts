import { test, expect } from '@playwright/test';

// 1) Home page loads
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Candidate Portal/i);
});

// 2) Login with real registered email -> redirects to resume page
test('login redirects to resume page', async ({ page }) => {
  // Mock login response to ensure isolation and avoid real backend dependencies
  await page.route('**/users/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        accessToken: 'fake-test-token',
        user: {
          id: 'test-123',
          email: process.env.E2E_TEST_EMAIL || 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    });
  });

  // Mock /users/me to ensure the resume page loads correctly with the mock user
  await page.route('**/users/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: 'test-123',
        email: process.env.E2E_TEST_EMAIL || 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        resumeUrl: null
      }
    });
  });

  await page.goto('/');

  // Navigate to login
  await page.click('text=Sign In');
  await expect(page).toHaveURL(/\/login/);

  // Fill login form
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
  await page.fill('input[placeholder="name@example.com"]', testEmail);

  // Click Sign In
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to /resume
  await expect(page).toHaveURL(/resume/, { timeout: 10000 });

  // Verify resume page loaded
  await expect(page.getByText('Active Session', { exact: false })).toBeVisible({ timeout: 10000 });
});
