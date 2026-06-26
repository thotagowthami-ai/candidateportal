import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Landing Page', path: '/' },
  { name: 'Login Page', path: '/login' },
  { name: 'Register Page', path: '/register' },
  { name: 'Terms of Service', path: '/terms' },
  { name: 'Privacy Policy', path: '/privacy' },
];

for (const pageInfo of pages) {
  test(`verify page loading: ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 1. Optional: Verify no unhandled JavaScript/console errors occurred
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    const response = await page.goto(pageInfo.path);

    // 2. Verify HTTP response is successful (200 OK)
    expect(response?.status()).toBe(200);

    // 3. Ensure page is not blank and has correct browser title loaded
    await expect(page).toHaveTitle(/Candidate Portal/i);

    expect(consoleErrors, `Console errors found on ${pageInfo.path}`).toEqual([]);
  });
}
