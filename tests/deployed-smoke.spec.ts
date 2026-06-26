import { expect, test, type Page } from '@playwright/test';

const apiURL = process.env.DEPLOYED_API_URL;

async function expectNoSevereConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

test.describe('deployed smoke', () => {
  test('home page loads without severe browser errors', async ({ page }) => {
    const errors = await expectNoSevereConsoleErrors(page);

    const response = await page.goto('/', { waitUntil: 'networkidle' });

    expect(response?.ok(), `home page returned ${response?.status()}`).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('primary navigation links do not return 404/500', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const hrefs = await page
      .locator('a[href^="/"], a[href^="http"]')
      .evaluateAll((links) =>
        Array.from(new Set(
          links
            .map((link) => (link as HTMLAnchorElement).href)
            .filter((href) => href && !href.includes('#')),
        )).slice(0, 12),
      );

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(
        response.status(),
        `${href} returned ${response.status()}`,
      ).toBeLessThan(400);
    }
  });

  test('auth screen is reachable', async ({ page }) => {
    const authPaths = ['/login', '/signin', '/sign-in', '/auth/login'];
    const statuses: string[] = [];

    for (const path of authPaths) {
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      const status = response?.status() ?? 0;
      statuses.push(`${path}: ${status}`);

      if (status < 400) {
        await expect(page.locator('body')).toBeVisible();
        return;
      }
    }

    throw new Error(`No auth page found. Tried ${statuses.join(', ')}`);
  });

  test('deployed API responds when DEPLOYED_API_URL is provided', async ({ request }) => {
    test.skip(!apiURL, 'DEPLOYED_API_URL not provided.');

    const healthPaths = ['/health', '/api/health', '/'];
    const statuses: string[] = [];

    for (const path of healthPaths) {
      const response = await request.get(new URL(path, apiURL).toString());
      statuses.push(`${path}: ${response.status()}`);

      if (response.status() < 500) {
        expect(response.status()).toBeLessThan(500);
        return;
      }
    }

    throw new Error(`API health check failed. Tried ${statuses.join(', ')}`);
  });
});
