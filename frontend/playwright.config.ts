import { defineConfig } from '@playwright/test';

// Fallback to local Vite preview server to prevent tests from running against production by default.
// Set BASE_URL environment variable in CI/runners.
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL,
    headless: true,
  },
  timeout: 30_000,
});
