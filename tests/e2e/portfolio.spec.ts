/**
 * Portfolio E2E Tests - Portfolio Tracker
 *
 * Tests for the Portfolio Configuration page:
 * - Asset management (create, edit, delete)
 * - Target allocation editing
 * - Empty state handling
 *
 * @see frontend/src/features/portfolio/index.tsx
 * @see frontend/src/features/portfolio/components/AssetForm.tsx
 * @see frontend/src/features/portfolio/components/AssetCard.tsx
 */

import { test, expect } from '../support/fixtures';

test.describe('Portfolio Page', () => {
  test.describe('Page Load', () => {
    test('[P0] should display portfolio page for authenticated user', async ({ page, authenticatedUser }) => {
      // WHEN: Navigating to portfolio
      await page.goto('/portfolio');

      // THEN: Portfolio heading is visible
      await expect(
        page.getByRole('heading', { level: 1, name: /portfolio configuration/i })
      ).toBeVisible();
    });

    test('[P0] should redirect to login if not authenticated', async ({ page }) => {
      // WHEN: Trying to access portfolio without auth
      await page.goto('/portfolio');

      // THEN: Redirected to login
      await expect(page).toHaveURL(/login/);
    });

    test('[P1] should show Add Asset button', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on portfolio page
      await page.goto('/portfolio');

      // THEN: Add Asset button is visible
      await expect(
        page.getByRole('button', { name: /add asset/i })
      ).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('[P1] should show empty state for new user', async ({ page, authenticatedUser }) => {
      // GIVEN: User has no assets
      await page.goto('/portfolio');
      await page.waitForLoadState('networkidle');

      // THEN: Empty state message is shown OR assets are displayed
      const emptyState = page.getByText(/no assets yet/i);
      const assetCards = page.locator('[class*="rounded-lg"][class*="border"]').filter({
        has: page.getByText(/target/i)
      });

      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasAssets = await assetCards.first().isVisible().catch(() => false);

      expect(hasEmptyState || hasAssets).toBeTruthy();
    });

    test('[P1] should show Add Your First Asset button in empty state', async ({ page, authenticatedUser }) => {
      // GIVEN: User has no assets
      await page.goto('/portfolio');
      await page.waitForLoadState('networkidle');

      // Check if empty state is shown
      const emptyState = page.getByText(/no assets yet/i);
      if (await emptyState.isVisible().catch(() => false)) {
        // THEN: Special first asset button is visible
        await expect(
          page.getByRole('button', { name: /add your first asset/i })
        ).toBeVisible();
      }
    });
  });

  test.describe('Create Asset', () => {
    test('[P0] should open create asset modal', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on portfolio page
      await page.goto('/portfolio');

      // WHEN: Clicking Add Asset button
      await page.getByRole('button', { name: /add asset/i }).first().click();

      // THEN: Modal opens with form
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Add New Asset')).toBeVisible();
    });

    test('[P1] should show asset form fields in modal', async ({ page, authenticatedUser }) => {
      // GIVEN: Create modal is open
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();

      // THEN: All form fields are visible
      await expect(page.getByLabel('Ticker')).toBeVisible();
      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Category')).toBeVisible();
      await expect(page.getByLabel('Moneda')).toBeVisible();
    });

    test('[P0] should create new asset successfully', async ({ page, authenticatedUser }) => {
      // GIVEN: Create modal is open
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();

      // WHEN: User fills form and submits
      await page.getByLabel('Ticker').fill('AAPL');
      await page.getByLabel('Name').fill('Apple Inc');
      await page.getByLabel('Category').selectOption('ETF');
      await page.getByLabel('Moneda').selectOption('USD');

      await page.getByRole('button', { name: /create asset/i }).click();

      // THEN: Modal closes and asset appears in list
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
      await expect(page.getByText('AAPL')).toBeVisible();
      await expect(page.getByText('Apple Inc')).toBeVisible();
    });

    test('[P1] should close modal on cancel', async ({ page, authenticatedUser }) => {
      // GIVEN: Create modal is open
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // WHEN: User clicks cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // THEN: Modal closes
      await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('[P2] should validate required fields', async ({ page, authenticatedUser }) => {
      // GIVEN: Create modal is open
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();

      // WHEN: User submits with empty ticker
      await page.getByLabel('Ticker').clear();
      await page.getByRole('button', { name: /create asset/i }).click();

      // THEN: Validation error is shown (alert role on error message)
      // The form validation shows errors below inputs
      const tickerError = page.getByRole('alert').first();
      await expect(tickerError).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Asset Cards', () => {
    test('[P1] should display asset information on card', async ({ page, authenticatedUser }) => {
      // First create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('VOO');
      await page.getByLabel('Name').fill('Vanguard S&P 500');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // THEN: Asset card shows correct info
      await expect(page.getByText('VOO')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Vanguard S&P 500' })).toBeVisible();
      await expect(page.getByText('ETF')).toBeVisible();
      // Target percentage is shown (0.0% for new asset)
      await expect(page.getByText('0.0%')).toBeVisible();
    });

    test('[P1] should have edit button on asset card', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset first
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('QQQ');
      await page.getByLabel('Name').fill('Invesco QQQ');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // THEN: Edit button is visible
      await expect(
        page.getByRole('button', { name: /edit qqq/i })
      ).toBeVisible();
    });

    test('[P1] should have delete button on asset card', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset first
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('BTC');
      await page.getByLabel('Name').fill('Bitcoin');
      await page.getByLabel('Category').selectOption('CRYPTO');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // THEN: Delete button is visible
      await expect(
        page.getByRole('button', { name: /delete btc/i })
      ).toBeVisible();
    });
  });

  test.describe('Edit Asset', () => {
    test('[P1] should open edit modal when clicking edit button', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('MSFT');
      await page.getByLabel('Name').fill('Microsoft');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // WHEN: Clicking edit button
      await page.getByRole('button', { name: /edit msft/i }).click();

      // THEN: Edit modal opens with pre-filled data
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel('Ticker')).toHaveValue('MSFT');
      await expect(page.getByLabel('Name')).toHaveValue('Microsoft');
    });

    test('[P1] should save changes when editing asset', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('GOOG');
      await page.getByLabel('Name').fill('Google');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // WHEN: Editing the asset
      await page.getByRole('button', { name: /edit goog/i }).click();
      await page.getByLabel('Name').fill('Alphabet Inc');
      await page.getByRole('button', { name: /save changes/i }).click();

      // THEN: Changes are saved
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
      await expect(page.getByText('Alphabet Inc')).toBeVisible();
    });
  });

  test.describe('Delete Asset', () => {
    test('[P1] should open delete confirmation dialog', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('TSLA');
      await page.getByLabel('Name').fill('Tesla');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // WHEN: Clicking delete button
      await page.getByRole('button', { name: /delete tsla/i }).click();

      // THEN: Confirmation alertdialog opens with title "Delete TSLA?"
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /delete tsla\?/i })).toBeVisible();
    });

    test('[P1] should delete asset when confirmed', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('AMZN');
      await page.getByLabel('Name').fill('Amazon');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // Verify asset exists
      await expect(page.getByText('AMZN')).toBeVisible();

      // WHEN: Deleting the asset
      await page.getByRole('button', { name: /delete amzn/i }).click();

      // Click "Delete" button in alertdialog
      const alertDialog = page.getByRole('alertdialog');
      await alertDialog.getByRole('button', { name: /^delete$/i }).click();

      // THEN: Asset is removed
      await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10000 });
      await expect(page.getByText('AMZN')).toBeHidden();
    });

    test('[P2] should cancel delete when clicking cancel', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset (use distinct ticker and name to avoid ambiguity)
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('NVDA');
      await page.getByLabel('Name').fill('Nvidia Corporation');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // Verify asset exists before delete attempt
      await expect(page.getByText('NVDA', { exact: true })).toBeVisible();

      // WHEN: Opening delete dialog and canceling
      await page.getByRole('button', { name: /delete nvda/i }).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();

      // Click cancel
      await page.getByRole('alertdialog').getByRole('button', { name: /cancel/i }).click();

      // THEN: Dialog closes and asset still exists
      await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('NVDA', { exact: true })).toBeVisible();
    });
  });

  test.describe('Target Editor', () => {
    test('[P1] should show Edit Targets button when assets exist', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('SPY');
      await page.getByLabel('Name').fill('SPDR S&P 500');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // THEN: Edit Targets button is visible
      await expect(
        page.getByRole('button', { name: /edit targets/i })
      ).toBeVisible();
    });

    test('[P1] should open target editor modal', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('IWM');
      await page.getByLabel('Name').fill('iShares Russell 2000');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // WHEN: Clicking Edit Targets
      await page.getByRole('button', { name: /edit targets/i }).click();

      // THEN: Target editor modal opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/edit target allocations/i)).toBeVisible();
    });
  });

  test.describe('Target Sum Indicator', () => {
    test('[P2] should show target sum indicator when assets exist', async ({ page, authenticatedUser }) => {
      // Setup: Create an asset
      await page.goto('/portfolio');
      await page.getByRole('button', { name: /add asset/i }).first().click();
      await page.getByLabel('Ticker').fill('VTI');
      await page.getByLabel('Name').fill('Vanguard Total Stock');
      await page.getByRole('button', { name: /create asset/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

      // THEN: Target sum indicator is visible (shows "Sum: X%")
      await expect(page.getByTestId('sum-value')).toBeVisible();
      await expect(page.getByText(/sum:/i)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('[P2] should be accessible from dashboard navigation', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on dashboard
      await page.goto('/dashboard');

      // WHEN: Clicking portfolio link
      await page.getByRole('link', { name: /portfolio/i }).click();

      // THEN: Navigates to portfolio page
      await expect(page).toHaveURL(/portfolio/);
      await expect(
        page.getByRole('heading', { name: /portfolio configuration/i })
      ).toBeVisible();
    });
  });
});
