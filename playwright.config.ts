import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://candidateportal-dmx4.vercel.app',
  },
  testDir: 'tests',
});
