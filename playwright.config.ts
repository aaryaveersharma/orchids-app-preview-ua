import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ]
});
