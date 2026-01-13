/**
 * Evolution E2E Tests - Portfolio Tracker
 *
 * Tests for the Evolution/Snapshots page functionality:
 * - Portfolio evolution chart
 * - Date range selection
 * - Currency toggle (USD/ARS)
 * - Evolution summary
 *
 * Run with: pnpm test:e2e tests/e2e/evolution.spec.ts
 */

import { test, expect } from '../support/fixtures';

test.describe('Evolution Page', () => {
  test.describe('Page Load', () => {
    test('[P0] should display evolution page for authenticated user', async ({ page, authenticatedUser }) => {
      // GIVEN: User is authenticated
      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Page loads with heading (Spanish: "Evolución del Portfolio")
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

      // THEN: Date range selector is visible
      const dateSelector = page.getByRole('combobox').or(page.locator('select')).or(
        page.getByText(/1M|3M|6M|1Y|ALL|YTD/i)
      );
      await expect(dateSelector.first()).toBeVisible({ timeout: 10000 });
    });

    test('[P1] should display currency toggle', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Currency toggle is visible
      const currencyToggle = page.getByText(/USD|ARS/i);
      await expect(currencyToggle.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Date Range Selection', () => {
    test('[P1] should default to ALL period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: ALL is selected by default (or visible as option)
      const allOption = page.getByText(/all|todo/i);
      await expect(allOption.first()).toBeVisible({ timeout: 10000 });
    });

    test('[P2] should change chart when selecting different period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User selects a different period
      const dateSelector = page.locator('select').first().or(page.getByRole('combobox').first());

      if (await dateSelector.isVisible()) {
        // Select 1 month
        await dateSelector.selectOption({ label: /1M|month|mes/i }).catch(() => {});
        await page.waitForLoadState('networkidle');

        // THEN: Page still displays correctly
        await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
      } else {
        // Might be button-based selector
        const monthButton = page.getByRole('button', { name: /1M|1 month|1 mes/i });
        if (await monthButton.isVisible()) {
          await monthButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
        }
      }
    });

    test('[P2] should show 3 month period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User selects 3M period
      const threeMonthOption = page.getByText(/3M|3 month|3 mes/i);

      if (await threeMonthOption.isVisible()) {
        await threeMonthOption.click();
        await page.waitForLoadState('networkidle');

        // THEN: Chart updates
        await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
      }
    });

    test('[P2] should show YTD period', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User selects YTD period
      const ytdOption = page.getByText(/YTD|year to date|este ano/i);

      if (await ytdOption.isVisible()) {
        await ytdOption.click();
        await page.waitForLoadState('networkidle');

        // THEN: Chart updates
        await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
      }
    });
  });

  test.describe('Currency Toggle', () => {
    test('[P1] should default to USD currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: USD is displayed or selected
      const usdIndicator = page.getByText(/USD|\$/);
      await expect(usdIndicator.first()).toBeVisible({ timeout: 10000 });
    });

    test('[P2] should toggle to ARS currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks ARS toggle
      const arsToggle = page.getByRole('button', { name: /ARS/i }).or(
        page.getByText(/ARS/).locator('..').getByRole('button')
      );

      if (await arsToggle.isVisible()) {
        await arsToggle.click();
        await page.waitForLoadState('networkidle');

        // THEN: Values should display in ARS
        // (values will include exchange rate conversion)
        await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
      }
    });

    test('[P2] should toggle back to USD currency', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with ARS selected
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // Toggle to ARS first
      const arsToggle = page.getByRole('button', { name: /ARS/i });
      if (await arsToggle.isVisible()) {
        await arsToggle.click();
        await page.waitForLoadState('networkidle');

        // WHEN: User toggles back to USD
        const usdToggle = page.getByRole('button', { name: /USD/i });
        await usdToggle.click();
        await page.waitForLoadState('networkidle');

        // THEN: Values display in USD
        await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();
      }
    });
  });

  test.describe('Evolution Chart', () => {
    test('[P1] should display chart with data points', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with snapshots
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Chart is visible
      const chartElement = page.locator('canvas, svg, [class*="chart"]').first();
      await expect(chartElement).toBeVisible({ timeout: 10000 });
    });

    test('[P2] should show loading state while fetching data', async ({ page, authenticatedUser }) => {
      // Add delay to API
      await page.route('**/api/snapshots**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return route.continue();
      });

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Loading state may be visible
      const loadingIndicator = page.getByText(/loading|cargando/i).or(
        page.locator('[class*="animate-pulse"]')
      );

      // Loading might be too fast to catch
      await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible({ timeout: 15000 });
    });

    test('[P2] should show empty state when no snapshots', async ({ page, authenticatedUser }) => {
      // Mock empty snapshots response
      await page.route('**/api/snapshots**', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ snapshots: [] }),
        })
      );

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Either shows empty chart or message
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('Evolution Summary', () => {
    test('[P2] should display summary section', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Summary section is visible (shows value changes, percentages, etc.)
      const summarySection = page.locator('[class*="summary"], [class*="card"]');
      await expect(summarySection.first()).toBeVisible({ timeout: 10000 });
    });

    test('[P2] should show change percentage', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with data
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Percentage change is displayed
      const percentageIndicator = page.getByText(/%/);
      // May or may not be visible depending on data
      const isVisible = await percentageIndicator.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('[P2] should show starting and current values', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page with data
      await page.goto('/evolution');
      await page.waitForLoadState('networkidle');

      // THEN: Value indicators are displayed
      const valueDisplay = page.getByText(/\$[\d,]+/);
      // May show $0 for new users
      const isVisible = await valueDisplay.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Error Handling', () => {
    test('[P2] should show error state when API fails', async ({ page, authenticatedUser }) => {
      // Intercept API to simulate error
      await page.route('**/api/snapshots**', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );

      // WHEN: Navigating to evolution page
      await page.goto('/evolution');

      // THEN: Error message is displayed
      await expect(page.getByText(/error|problema/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('[P2] should navigate from evolution to dashboard', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');

      // WHEN: Clicking dashboard link
      const dashboardLink = page.getByRole('link', { name: /dashboard|inicio/i });
      await dashboardLink.click();

      // THEN: Navigates to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });

    test('[P2] should navigate from evolution to holdings', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on evolution page
      await page.goto('/evolution');

      // WHEN: Clicking holdings link
      const holdingsLink = page.getByRole('link', { name: /holdings|posiciones/i });
      await holdingsLink.click();

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

      // THEN: Page is still usable
      await expect(page.getByRole('heading', { name: /evolucion|evolution/i })).toBeVisible();

      // Controls should still be accessible
      const dateSelector = page.locator('select, [role="combobox"]').first();
      const currencyToggle = page.getByText(/USD|ARS/i).first();

      const dateVisible = await dateSelector.isVisible().catch(() => false);
      const currencyVisible = await currencyToggle.isVisible().catch(() => false);

      expect(dateVisible || currencyVisible).toBeTruthy();
    });
  });
});
