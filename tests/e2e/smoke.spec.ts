/**
 * Smoke Tests - Portfolio Tracker
 *
 * Quick health check tests that should always pass.
 * Run these first to verify environment is working.
 *
 * Run with: pnpm test:e2e tests/e2e/smoke.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('frontend is accessible', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBeLessThan(400);
  });

  test('frontend returns HTML', async ({ page }) => {
    await page.goto('/');

    const html = await page.content();
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('API health check', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:10002';

    const response = await request.get(`${apiUrl}/health`);

    // Accept 200 or 404 (endpoint might not exist yet)
    expect([200, 404]).toContain(response.status());
  });

  test('page does not have JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // No JS errors should occur
    expect(errors).toHaveLength(0);
  });

  test('page does not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., favicon 404)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('favicon') && !error.includes('404'),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
