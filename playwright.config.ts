import { defineConfig, devices } from '@playwright/test';

/**
 * Prerequisites (local):
 *   npm run docker:infra && npm run api:migrate && npm run api:seed
 *   PAYMENTS_MODE=mock in api/.env
 *   npm run api:dev   (port 4000)
 *   npm run dev       (port 3000)
 *
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
