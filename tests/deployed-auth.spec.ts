import { expect, test, type Locator, type Page } from '@playwright/test';

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;
const testOtp = process.env.E2E_TEST_OTP;

const authPaths = ['/login', '/signin', '/sign-in', '/auth/login'];
const protectedPaths = [
  '/candidate/dashboard',
  '/recruiter/dashboard',
  '/candidate/profile',
  '/recruiter/jobs',
  '/jobs',
];

async function gotoFirstAvailable(page: Page, paths: string[]) {
  const tried: string[] = [];

  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    tried.push(`${path}: ${status}`);

    if (status < 400) {
      return path;
    }
  }

  throw new Error(`No available route found. Tried ${tried.join(', ')}`);
}

async function firstVisible(locator: Locator) {
  const count = await locator.count();

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);

    if (await item.isVisible()) {
      return item;
    }
  }

  return null;
}

test.describe('deployed auth flow', () => {
  test('test user can start login and reach the next auth step', async ({ page }) => {
    test.skip(!testEmail, 'E2E_TEST_EMAIL is required.');

    await gotoFirstAvailable(page, authPaths);

    const emailInput = await firstVisible(
      page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]'),
    );
    const passwordInput = await firstVisible(
      page.locator('input[type="password"], input[name*="password" i], input[placeholder*="password" i]'),
    );

    expect(emailInput, 'email input should be visible').not.toBeNull();

    await emailInput!.fill(testEmail!);

    if (passwordInput && testPassword) {
      await passwordInput.fill(testPassword);
    }

    const submitButton = await firstVisible(
      page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'),
    );

    expect(submitButton, 'login submit button should be visible').not.toBeNull();

    await Promise.all([
      page.waitForLoadState('networkidle'),
      submitButton!.click(),
    ]);

    await expect(page.locator('body')).toBeVisible();

    const otpInput = await firstVisible(
      page.locator(
        'input[name*="otp" i], input[name*="code" i], input[placeholder*="otp" i], input[placeholder*="code" i], input[inputmode="numeric"]',
      ),
    );

    if (otpInput && testOtp) {
      await otpInput.fill(testOtp);

      const verifyButton = await firstVisible(
        page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")'),
      );

      expect(verifyButton, 'OTP verify button should be visible').not.toBeNull();

      await Promise.all([
        page.waitForLoadState('networkidle'),
        verifyButton!.click(),
      ]);
    }

    const isAuthUrl = /\/(login|signin|sign-in)(\/)?$/i.test(new URL(page.url()).pathname);
    const hasNextAuthStep = !!otpInput || await page
      .locator('text=/otp|code|verify|check your/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      !isAuthUrl || hasNextAuthStep,
      'login should either leave the login route or show the next auth step',
    ).toBeTruthy();

    const currentPath = new URL(page.url()).pathname;

    if (protectedPaths.includes(currentPath)) {
      return;
    }

    if (hasNextAuthStep && !testOtp) {
      test.info().annotations.push({
        type: 'note',
        description: 'Login reached OTP/verification step. Provide E2E_TEST_OTP to complete protected-page assertion.',
      });
      return;
    }

    await gotoFirstAvailable(page, protectedPaths);
    await expect(page).not.toHaveURL(/\/(login|signin|sign-in)(\/)?$/i);
  });

  test('protected pages redirect anonymous users to auth', async ({ page }) => {
    const path = await gotoFirstAvailable(page, protectedPaths);

    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isStillOnProtectedPage = new URL(url).pathname === path;
    const hasAuthUrl = /login|signin|sign-in|auth/i.test(url);
    const hasAuthForm = await page
      .locator(
        'input[type="email"], input[type="password"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Continue with Google")',
      )
      .first()
      .isVisible()
      .catch(() => false);
    const hasMeaningfulPage = await page
      .locator('body')
      .innerText()
      .then((text) => text.trim().length > 20)
      .catch(() => false);

    expect(
      hasAuthUrl || hasAuthForm || !isStillOnProtectedPage || !hasMeaningfulPage,
      `anonymous user should be redirected or shown auth UI from ${path}`,
    ).toBeTruthy();
  });
});
