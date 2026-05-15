import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'https://candidateportal-dmx4.vercel.app';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL,
    headless: true,
  },
  timeout: 30_000,
});
