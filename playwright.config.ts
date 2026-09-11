import { defineConfig, devices } from '@playwright/test';

/**
 * Browser end-to-end tests against a running stack. The backend repo supplies
 * the first two (see its README); this repo supplies the third:
 *   infra + worker:  cd backend/infra && docker compose --env-file ../.env up -d
 *   API:             cd backend/api && npm run start:dev      (:4000)
 *   web:             npm run dev                              (:3000)
 *   then:            npx playwright test
 */
export default defineConfig({
  testDir: './tests/browser',
  // The pipeline (ingest → transcript → analysis → render) runs for real.
  timeout: 12 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    // localhost (not 127.0.0.1): browsers upload directly to storage, and the
    // storage CORS allow-list is origin-exact.
    baseURL: process.env.CLIPFOREST_WEB_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
