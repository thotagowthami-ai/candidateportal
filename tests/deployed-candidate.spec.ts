import { expect, test, type Locator, type Page } from '@playwright/test';
import path from 'node:path';

const testEmail = process.env.E2E_TEST_EMAIL;
const resumeFile = process.env.E2E_RESUME_FILE
  ? path.resolve(process.env.E2E_RESUME_FILE)
  : path.resolve(__dirname, 'fixtures/sample-resume.txt');

const authPaths = ['/login', '/signin', '/sign-in', '/auth/login'];
const uploadPaths = [
  '/profile',
  '/upload',
  '/resume',
];

async function gotoFirstAvailable(page: Page, paths: string[]) {
  const tried: string[] = [];

  for (const routePath of paths) {
    const response = await page.goto(routePath, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    tried.push(`${routePath}: ${status}`);

    if (status < 400) {
      return routePath;
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

async function startEmailLogin(page: Page) {
  await gotoFirstAvailable(page, authPaths);

  const emailInput = await firstVisible(
    page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]'),
  );

  expect(emailInput, 'email input should be visible').not.toBeNull();
  await emailInput!.fill(testEmail!);

  const submitButton = await firstVisible(
    page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'),
  );

  expect(submitButton, 'login submit button should be visible').not.toBeNull();

  await Promise.all([
    page.waitForLoadState('networkidle'),
    submitButton!.click(),
  ]);
}

test.describe('deployed candidate flow', () => {
  test('candidate resume upload UI is reachable after login start', async ({ page }) => {
    test.skip(!testEmail, 'E2E_TEST_EMAIL is required.');

    await startEmailLogin(page);

    const hasOtpStep = await page
      .locator('text=/otp|code|verify|check your/i')
      .first()
      .isVisible()
      .catch(() => false);

    test.skip(hasOtpStep && !process.env.E2E_TEST_OTP, 'Login reached OTP step. Provide E2E_TEST_OTP for upload testing.');

    if (process.env.E2E_TEST_OTP) {
      const otpInput = await firstVisible(
        page.locator(
          'input[name*="otp" i], input[name*="code" i], input[placeholder*="otp" i], input[placeholder*="code" i], input[inputmode="numeric"]',
        ),
      );

      expect(otpInput, 'OTP input should be visible').not.toBeNull();
      await otpInput!.fill(process.env.E2E_TEST_OTP);

      const verifyButton = await firstVisible(
        page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")'),
      );

      expect(verifyButton, 'OTP verify button should be visible').not.toBeNull();

      await Promise.all([
        page.waitForLoadState('networkidle'),
        verifyButton!.click(),
      ]);
    }

    await gotoFirstAvailable(page, uploadPaths);

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput, 'resume upload input should exist').toBeAttached();

    await fileInput.setInputFiles(resumeFile);

    const submitButton = await firstVisible(
      page.locator('button:has-text("Upload"), button:has-text("Save"), button:has-text("Submit"), button[type="submit"]'),
    );

    if (submitButton) {
      await Promise.all([
        page.waitForLoadState('networkidle').catch(() => undefined),
        submitButton.click(),
      ]);
    }

    await expect(page.locator('body')).toContainText(/resume|upload|profile|skill|experience/i);
  });
});
