import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test("home page loads", async ({ page }) => {
  const response = await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});

test("login page is reachable", async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/login`, {
    waitUntil: "domcontentloaded",
  });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
});
