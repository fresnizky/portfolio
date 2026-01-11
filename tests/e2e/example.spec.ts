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

  test('should show login link for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Look for login/register CTA
    const loginLink = page.getByRole('link', { name: /login|iniciar sesión/i });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should allow user registration', async ({ page, api }) => {
    const userData = createUser();

    await page.goto('/register');

    // Fill registration form
    await page.getByLabel(/email/i).fill(userData.email);
    await page.getByLabel(/password/i).first().fill(userData.password);
    await page.getByLabel(/confirm|confirmar/i).fill(userData.password);

    if (userData.name) {
      const nameField = page.getByLabel(/name|nombre/i);
      if (await nameField.isVisible()) {
        await nameField.fill(userData.name);
      }
    }

    // Submit
    await page.getByRole('button', { name: /register|registrar/i }).click();

    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/dashboard|onboarding/);
  });

  test('should allow user login', async ({ page }) => {
    // Note: This test assumes a user exists in the test DB
    // In real scenarios, seed via API first
    const userData = createUser({ email: 'existing@example.com', password: 'ExistingPass123!' });

    await page.goto('/login');

    await page.getByLabel(/email/i).fill(userData.email);
    await page.getByLabel(/password/i).fill(userData.password);
    await page.getByRole('button', { name: /login|iniciar/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /login|iniciar/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|inválido|error/i)).toBeVisible();
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
  test('should allow adding a new asset', async ({ page, authenticatedUser }) => {
    const assetData = createAsset({
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'ETF',
    });

    await page.goto('/assets/new');

    // Fill asset form
    await page.getByLabel(/ticker/i).fill(assetData.ticker);
    await page.getByLabel(/name|nombre/i).fill(assetData.name);

    // Select category
    const categorySelect = page.getByLabel(/category|categoría|type|tipo/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption(assetData.category);
    }

    // Submit
    await page.getByRole('button', { name: /add|agregar|create|crear/i }).click();

    // Should show success or redirect to assets list
    await expect(page.getByText(/success|éxito|created|creado/i).or(page.getByText(assetData.ticker))).toBeVisible();
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
