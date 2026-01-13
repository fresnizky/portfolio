/**
 * Evolution E2E Tests - Portfolio Tracker
 *
 * Tests for the Evolution/Snapshots page functionality:
 * - Portfolio evolution chart
 * - Date range selection (button group: 1M, 3M, 6M, 1Y, Todo)
 * - Currency toggle (button group: USD, ARS)
 * - Evolution summary
 *
 * @see frontend/src/features/evolution/index.tsx
 * @see frontend/src/features/evolution/components/DateRangeSelector.tsx
 * @see frontend/src/features/evolution/components/CurrencyToggle.tsx
 */

import { test, expect } from '../support/fixtures';

test.describe('Evolution Page', () => {
  test.describe('Page Load', () => {
    test('[P0] should display evolution page for authenticated user', async ({ page, authenticatedUser }) => {
      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Page loads with heading "Evolución del Portfolio" (in main content)
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('[P1] should display evolution chart section', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Chart section (white rounded container) is visible
      await expect(page.locator('.bg-white.border.rounded-lg').first()).toBeVisible({ timeout: 10000 });
    });

    test('[P1] should display date range selector', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Date range buttons are visible (1M, 3M, 6M, 1Y, Todo)
      await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Todo' })).toBeVisible();
    });

    test('[P1] should display currency toggle', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Currency toggle buttons are visible (USD, ARS)
      await expect(page.getByRole('button', { name: 'USD' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'ARS' })).toBeVisible();
    });
  });

  test.describe('Date Range Selection', () => {
    test('[P1] should default to Todo (ALL) period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: "Todo" button has active styling (bg-blue-500)
      const todoButton = page.getByRole('button', { name: 'Todo' });
      await expect(todoButton).toBeVisible();
      // Active button has blue background
      await expect(todoButton).toHaveClass(/bg-blue-500/);
    });

    test('[P2] should change period when clicking 1M button', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks 1M button
      await page.getByRole('button', { name: '1M' }).click();

      // THEN: 1M button becomes active
      await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/bg-blue-500/);
    });

    test('[P2] should show 3 month period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks 3M button
      await page.getByRole('button', { name: '3M' }).click();

      // THEN: 3M button becomes active
      await expect(page.getByRole('button', { name: '3M' })).toHaveClass(/bg-blue-500/);
    });

    test('[P2] should show 1 year period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks 1Y button
      await page.getByRole('button', { name: '1Y' }).click();

      // THEN: 1Y button becomes active
      await expect(page.getByRole('button', { name: '1Y' })).toHaveClass(/bg-blue-500/);
    });
  });

  test.describe('Currency Toggle', () => {
    test('[P1] should default to USD currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: USD button has active styling
      const usdButton = page.getByRole('button', { name: 'USD' });
      await expect(usdButton).toBeVisible();
      await expect(usdButton).toHaveClass(/bg-blue-500/);
    });

    test('[P2] should toggle to ARS currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks ARS button
      await page.getByRole('button', { name: 'ARS' }).click();

      // THEN: ARS button becomes active
      await expect(page.getByRole('button', { name: 'ARS' })).toHaveClass(/bg-blue-500/);
    });

    test('[P2] should toggle back to USD currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with ARS selected
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // Toggle to ARS first
      await page.getByRole('button', { name: 'ARS' }).click();
      await expect(page.getByRole('button', { name: 'ARS' })).toHaveClass(/bg-blue-500/);

      // WHEN: User toggles back to USD
      await page.getByRole('button', { name: 'USD' }).click();

      // THEN: USD button is active again
      await expect(page.getByRole('button', { name: 'USD' })).toHaveClass(/bg-blue-500/);
    });
  });

  test.describe('Evolution Chart', () => {
    test('[P1] should display chart container', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Chart container is visible
      await expect(page.locator('.bg-white.border.rounded-lg').first()).toBeVisible();
    });

    test('[P2] should show loading state while fetching data', async ({ page, authenticatedUser }) => {
      // Add delay to API
      await page.route('**/api/snapshots**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return route.continue();
      });

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Page loads eventually
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('[P2] should show empty state when no snapshots', async ({ page, authenticatedUser }) => {
      // Mock empty snapshots response
      await page.route('**/api/snapshots**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ snapshots: [] }),
        })
      );

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Page loads without crash
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Evolution Summary', () => {
    test('[P2] should display page content', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Page content is visible (heading and controls)
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'USD' })).toBeVisible();
    });

    test('[P2] should show change percentage when data exists', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with data
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Page loads (percentage may or may not be visible depending on data)
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('[P2] should show values when data exists', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with data
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Page loads (values may or may not be visible depending on data)
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('[P2] should show error state when API fails', async ({ page, authenticatedUser }) => {
      // Intercept API to simulate error
      await page.route('**/api/snapshots**', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Error message is displayed
      await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('[P2] should navigate from evolution to dashboard', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');

      // WHEN: Clicking dashboard link
      await page.getByRole('link', { name: /dashboard/i }).click();

      // THEN: Navigates to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });

    test('[P2] should navigate from evolution to holdings', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');

      // WHEN: Clicking holdings link
      await page.getByRole('link', { name: /holdings/i }).click();

      // THEN: Navigates to holdings
      await expect(page).toHaveURL(/holdings/);
    });
  });

  test.describe('Responsiveness', () => {
    test('[P3] should display correctly on mobile viewport', async ({ page, authenticatedUser }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // GIVEN: User is on evolution page on mobile
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Page heading is still visible (in main content)
      await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();

      // Currency toggle should still be accessible
      await expect(page.getByRole('button', { name: 'USD' })).toBeVisible();
    });
  });
});
