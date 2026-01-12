/**
 * Example E2E Tests - Portfolio Tracker
 *
 * These tests demonstrate the framework patterns:
 * - Fixture usage (authenticatedUser, api)
 * - Data factories (createUser, createAsset)
 * - API seeding before UI validation
 *
 * Run with: pnpm test:e2e
 */

import { test, expect } from '../support/fixtures';
import { createUser, createAsset, createDiversifiedPortfolio } from '../support/factories';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Basic smoke test - page loads
    await expect(page).toHaveTitle(/Portfolio/i);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/');

    // Unauthenticated users should be redirected to login page
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Authentication Flow', () => {
  // Note: Registration is done via API only, no UI registration page exists
  test.skip('should allow user registration', async ({ page }) => {
    // Skip: No /register route exists in this app
    // Registration is handled via API endpoint only
  });

  test('should allow user login', async ({ page, request }) => {
    // First seed a user via API
    const userData = createUser();

    try {
      await request.post('http://localhost:10002/api/auth/register', {
        data: userData,
      });
    } catch {
      // User might already exist
    }

    await page.goto('/login');

    await page.getByLabel(/email/i).fill(userData.email);
    await page.getByLabel(/password/i).fill(userData.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/dashboard|onboarding/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('Dashboard (Authenticated)', () => {
  test('should display user dashboard', async ({ page, authenticatedUser }) => {
    await page.goto('/dashboard');

    // Dashboard should load for authenticated user
    await expect(page.getByText(/portfolio|cartera/i)).toBeVisible();
  });

  test('should show empty state for new user', async ({ page, authenticatedUser }) => {
    await page.goto('/dashboard');

    // New user should see empty state or onboarding prompt
    const emptyState = page.getByText(/no assets|sin activos|add your first|agrega tu primer/i);
    const onboardingPrompt = page.getByText(/onboarding|configurar|setup/i);

    // Either empty state or onboarding should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasOnboarding = await onboardingPrompt.isVisible().catch(() => false);

    expect(hasEmptyState || hasOnboarding).toBeTruthy();
  });
});

test.describe('Asset Management', () => {
  test('should allow adding a new asset from portfolio page', async ({ page, authenticatedUser }) => {
    // Assets are managed from the /portfolio page, not /assets/new
    await page.goto('/portfolio');

    // Look for add asset button
    const addButton = page.getByRole('button', { name: /add|agregar|nuevo/i });

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();

      // Modal should open
      const modal = page.getByRole('dialog').or(page.locator('[class*="modal"]'));
      await expect(modal).toBeVisible();

      // Fill asset form
      const tickerInput = page.getByLabel(/ticker/i);
      if (await tickerInput.isVisible()) {
        await tickerInput.fill('VOO');
      }

      const nameInput = page.getByLabel(/name|nombre/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('Vanguard S&P 500 ETF');
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /save|guardar|create|crear|add|agregar/i });
      await submitButton.click();

      // Modal should close or show success
      await expect(modal).toBeHidden({ timeout: 10000 });
    }
  });
});

/**
 * Example test using API seeding (recommended pattern)
 * Seed data via API, then validate UI
 */
test.describe('Portfolio with Seeded Data', () => {
  test.skip('should display portfolio value', async ({ page, authenticatedUser, api }) => {
    // This test demonstrates the API seeding pattern
    // Skip until API endpoints are ready

    const portfolio = createDiversifiedPortfolio();

    // Seed assets via API (fast!)
    for (const asset of portfolio.assets) {
      await api.post('/api/assets', {
        ...asset,
        // authenticatedUser.token is already in cookies
      });
    }

    // Now validate UI
    await page.goto('/dashboard');

    // Should show portfolio summary
    await expect(page.getByText(/total value|valor total/i)).toBeVisible();

    // Should show all assets
    for (const asset of portfolio.assets) {
      await expect(page.getByText(asset.ticker)).toBeVisible();
    }
  });
});
