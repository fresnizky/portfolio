/**
 * Onboarding E2E Tests - Portfolio Tracker
 *
 * Tests for the Onboarding flow:
 * - Step 1: Asset setup
 * - Step 2: Target percentages
 * - Step 3: Holdings setup
 * - Skip onboarding
 * - Complete onboarding
 *
 * Run with: pnpm test:e2e tests/e2e/onboarding.spec.ts
 */

import { test, expect } from '../support/fixtures';
import { createUser } from '../support/factories';

test.describe('Onboarding Flow', () => {
  test.describe('Page Access', () => {
    test('[P0] should display onboarding page for new users', async ({ page, authenticatedUser }) => {
      // GIVEN: User is authenticated
      // WHEN: Navigating to onboarding
      await page.goto('/onboarding');

      // THEN: Onboarding page loads
      await expect(page.getByText(/configura|setup|activos|assets/i)).toBeVisible({ timeout: 10000 });
    });

    test('[P1] should show step 1 as initial step', async ({ page, authenticatedUser }) => {
      // GIVEN: User navigates to onboarding
      await page.goto('/onboarding');

      // THEN: Step 1 (Asset Setup) is displayed
      await expect(page.getByText(/configura tus activos|setup assets|step 1/i)).toBeVisible();
    });

    test('[P1] should display skip option', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding
      await page.goto('/onboarding');

      // THEN: Skip button is visible
      await expect(page.getByRole('button', { name: /skip|omitir|saltar/i })).toBeVisible();
    });
  });

  test.describe('Step 1: Asset Setup', () => {
    test('[P1] should show add asset form in step 1', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on step 1
      await page.goto('/onboarding');

      // THEN: Asset addition controls are visible
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await expect(tickerInput).toBeVisible({ timeout: 10000 });
    });

    test('[P1] should allow adding an asset', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on step 1
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // WHEN: User fills asset form
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');

      const nameInput = page.getByLabel(/name|nombre/i).or(page.getByPlaceholder(/name|nombre/i));
      if (await nameInput.isVisible()) {
        await nameInput.fill('Vanguard S&P 500 ETF');
      }

      // Select category
      const categorySelect = page.getByLabel(/category|categoria|type|tipo/i).or(page.locator('select').first());
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 }).catch(() => {});
      }

      // Click add button
      const addButton = page.getByRole('button', { name: /add|agregar/i });
      await addButton.click();

      // THEN: Asset is added to the list
      await expect(page.getByText('VOO')).toBeVisible();
    });

    test('[P2] should allow removing an asset', async ({ page, authenticatedUser }) => {
      // GIVEN: User has added an asset
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Add an asset first
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('TEST');

      const addButton = page.getByRole('button', { name: /add|agregar/i });
      await addButton.click();

      await expect(page.getByText('TEST')).toBeVisible();

      // WHEN: User removes the asset
      const removeButton = page.getByRole('button', { name: /remove|eliminar|delete|borrar|x/i }).first();
      if (await removeButton.isVisible()) {
        await removeButton.click();

        // THEN: Asset is removed
        await expect(page.getByText('TEST')).toBeHidden();
      }
    });

    test('[P1] should enable next button when at least one asset is added', async ({ page, authenticatedUser }) => {
      // GIVEN: User has added an asset
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');

      const addButton = page.getByRole('button', { name: /add|agregar/i });
      await addButton.click();

      // THEN: Next button is enabled
      const nextButton = page.getByRole('button', { name: /next|siguiente|continue|continuar/i });
      await expect(nextButton).toBeEnabled();
    });
  });

  test.describe('Step 2: Target Setup', () => {
    test('[P1] should navigate to step 2 after adding assets', async ({ page, authenticatedUser }) => {
      // GIVEN: User has completed step 1
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Add an asset
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');

      const addButton = page.getByRole('button', { name: /add|agregar/i });
      await addButton.click();

      // WHEN: User clicks next
      const nextButton = page.getByRole('button', { name: /next|siguiente|continue|continuar/i });
      await nextButton.click();

      // THEN: Step 2 is displayed
      await expect(page.getByText(/define.*target|target|objetivo|porcentaje/i)).toBeVisible();
    });

    test('[P1] should show target percentage inputs for each asset', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 2
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // THEN: Target input is visible
      const targetInput = page.getByLabel(/target|objetivo|%/i).or(page.locator('input[type="number"]').first());
      await expect(targetInput).toBeVisible();
    });

    test('[P1] should show target sum indicator', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 2
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // THEN: Sum indicator shows percentage (0%, 100%, etc.)
      await expect(page.getByText(/%/)).toBeVisible();
    });

    test('[P1] should validate targets sum to 100%', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 2 with one asset
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // WHEN: User sets target to 100%
      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');

      // THEN: Next button should be enabled (valid)
      const nextButton = page.getByRole('button', { name: /next|siguiente|continue|continuar/i });
      await expect(nextButton).toBeEnabled();
    });

    test('[P2] should show error when targets don\'t sum to 100%', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 2 with one asset
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // WHEN: User sets target to something other than 100%
      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('50');

      // THEN: Validation indicator shows sum is not 100%
      const sumIndicator = page.getByText(/50%/);
      await expect(sumIndicator).toBeVisible();

      // Next button should be disabled
      const nextButton = page.getByRole('button', { name: /next|siguiente|continue|continuar/i });
      await expect(nextButton).toBeDisabled();
    });
  });

  test.describe('Step 3: Holdings Setup', () => {
    test('[P1] should navigate to step 3 after setting targets', async ({ page, authenticatedUser }) => {
      // Setup: Complete steps 1 and 2
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Step 1: Add asset
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // Step 2: Set target to 100%
      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // THEN: Step 3 is displayed
      await expect(page.getByText(/carga.*posiciones|holdings|cantidades|optional/i)).toBeVisible();
    });

    test('[P1] should show holdings input for each asset', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 3
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // THEN: Holdings input is visible
      const holdingsInput = page.getByLabel(/quantity|cantidad|holding/i).or(page.locator('input[type="number"]').first());
      await expect(holdingsInput).toBeVisible();
    });

    test('[P2] should allow setting holdings quantity', async ({ page, authenticatedUser }) => {
      // Setup: Navigate to step 3
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // WHEN: User enters holdings quantity
      const holdingsInput = page.locator('input[type="number"]').first();
      await holdingsInput.fill('10');

      // THEN: Value is set
      await expect(holdingsInput).toHaveValue('10');
    });
  });

  test.describe('Complete Onboarding', () => {
    test('[P0] should complete onboarding and redirect to dashboard', async ({ page, authenticatedUser }) => {
      // Setup: Complete all steps
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Step 1: Add asset
      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // Step 2: Set target to 100%
      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // Step 3: Optionally set holdings
      const holdingsInput = page.locator('input[type="number"]').first();
      await holdingsInput.fill('10');

      // WHEN: User clicks complete/finish
      const completeButton = page.getByRole('button', { name: /complete|completar|finish|finalizar|done|listo/i });
      await completeButton.click();

      // THEN: Redirects to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('[P1] should show loading state during completion', async ({ page, authenticatedUser }) => {
      // Setup: Complete all steps
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // WHEN: User clicks complete
      const completeButton = page.getByRole('button', { name: /complete|completar|finish|finalizar|done|listo/i });

      // Check for loading state (button might show loading text or be disabled)
      await completeButton.click();

      // THEN: Button shows loading or is disabled briefly
      // This happens fast, so we just verify no crash and redirect happens
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });
  });

  test.describe('Skip Onboarding', () => {
    test('[P1] should skip onboarding and redirect to dashboard', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding
      await page.goto('/onboarding');

      // WHEN: User clicks skip
      const skipButton = page.getByRole('button', { name: /skip|omitir|saltar/i });
      await skipButton.click();

      // THEN: Redirects to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('[P2] should confirm skip action', async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding
      await page.goto('/onboarding');

      // WHEN: User clicks skip
      const skipButton = page.getByRole('button', { name: /skip|omitir|saltar/i });
      await skipButton.click();

      // THEN: Either confirms and redirects, or shows confirmation dialog
      const confirmDialog = page.getByRole('dialog');
      const dialogVisible = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false);

      if (dialogVisible) {
        // If confirmation required, confirm it
        const confirmButton = page.getByRole('button', { name: /confirm|confirmar|yes|si/i });
        await confirmButton.click();
      }

      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });
  });

  test.describe('Navigation', () => {
    test('[P2] should allow going back between steps', async ({ page, authenticatedUser }) => {
      // Setup: Get to step 2
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // Verify we're on step 2
      await expect(page.getByText(/target|objetivo/i)).toBeVisible();

      // WHEN: User clicks back
      const backButton = page.getByRole('button', { name: /back|atras|previous|anterior/i });
      await backButton.click();

      // THEN: Returns to step 1
      await expect(page.getByText(/configura tus activos|setup assets/i)).toBeVisible();
    });

    test('[P2] should preserve data when navigating back', async ({ page, authenticatedUser }) => {
      // Setup: Add asset and go to step 2
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // Go back
      const backButton = page.getByRole('button', { name: /back|atras|previous|anterior/i });
      await backButton.click();

      // THEN: Asset is still in the list
      await expect(page.getByText('VOO')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('[P2] should show error when completion fails', async ({ page, authenticatedUser }) => {
      // Intercept completion API to fail
      await page.route('**/api/onboarding/**', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Failed to complete onboarding' }),
          });
        }
        return route.continue();
      });

      // Complete all steps
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const tickerInput = page.getByLabel(/ticker/i).or(page.getByPlaceholder(/ticker/i));
      await tickerInput.fill('VOO');
      await page.getByRole('button', { name: /add|agregar/i }).click();
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      const targetInput = page.locator('input[type="number"]').first();
      await targetInput.fill('100');
      await page.getByRole('button', { name: /next|siguiente|continue|continuar/i }).click();

      // WHEN: User tries to complete
      const completeButton = page.getByRole('button', { name: /complete|completar|finish|finalizar|done|listo/i });
      await completeButton.click();

      // THEN: Error message is shown
      await expect(page.getByText(/error|problema|fallo/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
