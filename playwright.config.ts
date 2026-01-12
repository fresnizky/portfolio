import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Portfolio Tracker - Playwright E2E Configuration
 *
 * Timeouts (TEA Standards):
 * - Action: 15s (click, fill, etc.)
 * - Navigation: 30s (page.goto, reload)
 * - Expect: 10s (assertions)
 * - Test: 60s (overall)
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Load environment-specific config
// Default ports are for E2E stack (10021, 10022) - separate from dev (10001, 10002)
const baseURL = process.env.BASE_URL || 'http://localhost:10021';
const apiURL = process.env.API_URL || 'http://localhost:10022';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',

  // Parallel execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeouts (TEA Standards)
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  // Global settings
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Artifacts: failure-only (saves space)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Extra HTTP headers for API context
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Reporters: HTML + JUnit + List
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Web server configuration (optional - start frontend/backend)
  // Uncomment if you want Playwright to start services automatically
  // webServer: [
  //   {
  //     command: 'cd frontend && pnpm dev',
  //     url: baseURL,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120_000,
  //   },
  //   {
  //     command: 'cd backend && pnpm dev',
  //     url: `${apiURL}/health`,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120_000,
  //   },
  // ],
});

// Export API URL for use in tests
export { apiURL };
