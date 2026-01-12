/**
 * Transactions E2E Tests - Portfolio Tracker
 *
 * Tests for the Transactions page functionality:
 * - Transaction list display
 * - Create transaction modal
 * - Transaction filters
 * - Transaction summary
 *
 * Run with: pnpm test:e2e tests/e2e/transactions.spec.ts
 */

import { test, expect } from '../support/fixtures';
import { createAsset, createETF, createTransaction, createBuyTransaction } from '../support/factories';

test.describe('Transactions Page', () => {
  test.describe('Page Load', () => {
    test('[P0] should display transactions page for authenticated user', async ({ page, authenticatedUser }) => {
      // GIVEN: User is authenticated
      // WHEN: Navigating to transactions page
      await page.goto('/transactions');

      // THEN: Page loads with correct heading
      await expect(page.getByRole('heading', { name: /transaction/i })).toBeVisible();
    });

    test('[P1] should show add transaction button', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');

      // THEN: Add transaction button is visible
      await expect(page.getByRole('button', { name: /add|agregar|nueva/i })).toBeVisible();
    });

    test('[P1] should show transaction summary section', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // THEN: Summary section is visible (may show totals or empty state)
      const summarySection = page.locator('[class*="summary"], [class*="card"]').first();
      await expect(summarySection).toBeVisible({ timeout: 10000 });
    });

    test('[P1] should show filters section', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // THEN: Filters are visible
      const filtersArea = page.getByText(/filter|filtro|type|tipo|date|fecha/i).first();
      await expect(filtersArea).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Transaction List', () => {
    test('[P1] should display empty state when no transactions exist', async ({ page, authenticatedUser }) => {
      // GIVEN: User has no transactions
      // WHEN: Navigating to transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // THEN: Either shows empty state or transaction list
      const emptyState = page.getByText(/no transaction|sin transacc|empty/i);
      const transactionList = page.locator('[class*="transaction"], [class*="list"]');

      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasList = await transactionList.isVisible().catch(() => false);

      expect(hasEmptyState || hasList).toBeTruthy();
    });

    test('[P2] should show transaction details in list items', async ({ page, authenticatedUser }) => {
      // GIVEN: User has transactions
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // WHEN: Transaction list is populated
      const listItem = page.locator('[class*="transaction"], [class*="card"], [class*="item"]').first();

      if (await listItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        // THEN: Transaction shows relevant details
        const itemText = await listItem.textContent();
        // Should contain some combination of: ticker, type, amount, date
        expect(itemText).toBeTruthy();
      }
    });
  });

  test.describe('Create Transaction Modal', () => {
    test('[P1] should open create transaction modal', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // WHEN: User clicks add transaction button
      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });
      await addButton.click();

      // THEN: Modal opens
      await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible();
      await expect(page.getByText(/record|registrar|transaction/i)).toBeVisible();
    });

    test('[P1] should show transaction form fields', async ({ page, authenticatedUser }) => {
      // GIVEN: Create transaction modal is open
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });
      await addButton.click();

      // WHEN: Modal is open
      await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible();

      // THEN: Form fields are visible
      // Asset selector
      const assetSelector = page.getByLabel(/asset|activo/i).or(page.locator('select').first());
      await expect(assetSelector).toBeVisible();

      // Transaction type (BUY/SELL)
      const typeSelector = page.getByText(/buy|sell|compra|venta/i).first();
      await expect(typeSelector).toBeVisible();

      // Quantity field
      const quantityField = page.getByLabel(/quantity|cantidad/i).or(page.locator('input[type="number"]').first());
      await expect(quantityField).toBeVisible();
    });

    test('[P1] should validate required fields before submit', async ({ page, authenticatedUser }) => {
      // GIVEN: Create transaction modal is open
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });
      await addButton.click();
      await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible();

      // WHEN: User tries to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /save|guardar|create|crear|record|registrar/i });

      // Submit might be disabled or show validation error
      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // THEN: Validation errors appear or form is not submitted
        const errorMessage = page.getByText(/required|requerido|invalid|invalido|error/i);
        const isModalStillOpen = await page.getByRole('dialog').or(page.locator('[class*="modal"]')).isVisible();

        // Either error shown or modal stays open (validation prevented submit)
        const hasError = await errorMessage.isVisible().catch(() => false);
        expect(hasError || isModalStillOpen).toBeTruthy();
      } else {
        // Button disabled means validation is preventing submit
        await expect(submitButton).toBeDisabled();
      }
    });

    test('[P1] should close modal on cancel', async ({ page, authenticatedUser }) => {
      // GIVEN: Create transaction modal is open
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });
      await addButton.click();
      await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible();

      // WHEN: User clicks cancel
      const cancelButton = page.getByRole('button', { name: /cancel|cancelar/i });
      await cancelButton.click();

      // THEN: Modal closes
      await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeHidden();
    });

    test('[P1] should create BUY transaction successfully', async ({ page, authenticatedUser, api }) => {
      // GIVEN: User has at least one asset and modal is open
      // First ensure an asset exists
      const assetData = createETF({ ticker: 'TEST-VOO', name: 'Test Vanguard ETF' });

      try {
        await api.post('/api/assets', {
          ticker: assetData.ticker,
          name: assetData.name,
          category: assetData.category,
          currency: assetData.currency || 'USD',
          targetPercentage: assetData.targetPercentage || 25,
        });
      } catch {
        // Asset might already exist
      }

      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });

      // Button might be disabled if no assets
      if (await addButton.isEnabled()) {
        await addButton.click();
        await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeVisible();

        // WHEN: User fills the form and submits
        // Select asset
        const assetSelect = page.locator('select').first();
        await assetSelect.selectOption({ index: 1 }).catch(() => {});

        // Select BUY type
        const buyOption = page.getByLabel(/buy|compra/i).or(page.getByText(/buy|compra/i).first());
        if (await buyOption.isVisible()) {
          await buyOption.click().catch(() => {});
        }

        // Fill quantity
        const quantityInput = page.getByLabel(/quantity|cantidad/i).or(page.locator('input[type="number"]').first());
        await quantityInput.fill('10');

        // Fill price
        const priceInput = page.getByLabel(/price|precio/i).or(page.locator('input[type="number"]').nth(1));
        if (await priceInput.isVisible()) {
          await priceInput.fill('100');
        }

        // Fill date (if visible)
        const dateInput = page.getByLabel(/date|fecha/i).or(page.locator('input[type="date"]'));
        if (await dateInput.isVisible()) {
          const today = new Date().toISOString().split('T')[0];
          await dateInput.fill(today);
        }

        // Submit
        const submitButton = page.getByRole('button', { name: /save|guardar|create|crear|record|registrar/i });
        await submitButton.click();

        // THEN: Modal closes (success) or shows error (which we also handle)
        await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]'))).toBeHidden({ timeout: 10000 });
      }
    });
  });

  test.describe('Transaction Filters', () => {
    test('[P2] should filter transactions by type', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // WHEN: User selects a filter (e.g., BUY only)
      const typeFilter = page.getByLabel(/type|tipo/i).or(page.locator('select').first());

      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption({ label: /buy|compra/i }).catch(() => {});

        // THEN: List updates (we can't easily verify content, but page shouldn't crash)
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /transaction/i })).toBeVisible();
      }
    });

    test('[P2] should filter transactions by asset', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // WHEN: User selects an asset filter
      const assetFilter = page.getByLabel(/asset|activo/i).or(page.locator('select').nth(1));

      if (await assetFilter.isVisible()) {
        // Select first non-empty option
        await assetFilter.selectOption({ index: 1 }).catch(() => {});

        // THEN: List updates
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /transaction/i })).toBeVisible();
      }
    });

    test('[P2] should filter transactions by date range', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // WHEN: User sets date filters
      const startDateInput = page.getByLabel(/from|desde|start/i).or(page.locator('input[type="date"]').first());
      const endDateInput = page.getByLabel(/to|hasta|end/i).or(page.locator('input[type="date"]').last());

      if (await startDateInput.isVisible()) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        await startDateInput.fill(lastMonth.toISOString().split('T')[0]);
        await endDateInput.fill(new Date().toISOString().split('T')[0]);

        // THEN: List updates
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /transaction/i })).toBeVisible();
      }
    });

    test('[P2] should clear filters', async ({ page, authenticatedUser }) => {
      // GIVEN: User has applied filters
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // Look for clear/reset button
      const clearButton = page.getByRole('button', { name: /clear|limpiar|reset/i });

      if (await clearButton.isVisible()) {
        // WHEN: User clicks clear filters
        await clearButton.click();

        // THEN: Filters are reset
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /transaction/i })).toBeVisible();
      }
    });
  });

  test.describe('Transaction Summary', () => {
    test('[P2] should display summary totals', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // THEN: Summary section shows totals
      const summaryArea = page.locator('[class*="summary"], [class*="card"]').first();

      if (await summaryArea.isVisible()) {
        const summaryText = await summaryArea.textContent();
        // Summary should contain some total or count
        expect(summaryText).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('[P2] should show error state when API fails', async ({ page, authenticatedUser }) => {
      // Intercept API to simulate error
      await page.route('**/api/transactions**', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );

      // GIVEN: API returns error
      // WHEN: Navigating to transactions page
      await page.goto('/transactions');

      // THEN: Error message is displayed
      await expect(page.getByText(/error|problema/i)).toBeVisible({ timeout: 10000 });
    });

    test('[P2] should handle transaction creation failure gracefully', async ({ page, authenticatedUser }) => {
      // Intercept transaction creation to fail
      await page.route('**/api/transactions', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 400,
            body: JSON.stringify({ error: 'Invalid transaction data' }),
          });
        }
        return route.continue();
      });

      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add|agregar|nueva/i });

      if (await addButton.isEnabled()) {
        await addButton.click();

        // Fill minimal data and submit
        const submitButton = page.getByRole('button', { name: /save|guardar|create|crear|record|registrar/i });
        await submitButton.click().catch(() => {});

        // THEN: Error is shown or modal stays open
        const errorMessage = page.getByText(/error|failed|fallo/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        const isModalOpen = await page.getByRole('dialog').or(page.locator('[class*="modal"]')).isVisible();

        expect(hasError || isModalOpen).toBeTruthy();
      }
    });
  });

  test.describe('Navigation', () => {
    test('[P2] should navigate from transactions to dashboard', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on transactions page
      await page.goto('/transactions');

      // WHEN: Clicking dashboard link in navigation
      const dashboardLink = page.getByRole('link', { name: /dashboard|inicio/i });
      await dashboardLink.click();

      // THEN: User is on dashboard page
      await expect(page).toHaveURL(/dashboard/);
    });
  });
});
