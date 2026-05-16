import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  const r = await page.goto("/");
  expect(r).not.toBeNull();
  expect(r?.status()).toBeLessThan(400);
});
