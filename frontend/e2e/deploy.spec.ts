import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  const r = await page.goto("https://candidateportal-dmx4.vercel.app");
  expect(r?.status()).toBeLessThan(400);
});
