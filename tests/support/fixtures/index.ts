import { test as base, expect, mergeTests } from '@playwright/test';
import type { APIRequestContext, Page, BrowserContext } from '@playwright/test';
import {
  apiRequest,
  seedUser,
  loginUser,
  cleanupResources,
  type HttpMethod,
} from '../helpers/api-helpers';

/**
 * Portfolio Tracker - Test Fixtures
 *
 * Composable fixtures following TEA fixture-architecture pattern:
 * - Pure function → Fixture wrapper
 * - mergeTests for composition
 * - Auto-cleanup in fixture teardown
 *
 * @example
 * import { test, expect } from '../support/fixtures';
 *
 * test('user can view dashboard', async ({ page, authenticatedUser }) => {
 *   await page.goto('/dashboard');
 *   await expect(page.getByText(authenticatedUser.email)).toBeVisible();
 * });
 */

// ============================================
// Types
// ============================================

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  token: string;
}

interface ApiFixture {
  get: <T>(endpoint: string) => Promise<T>;
  post: <T>(endpoint: string, data?: unknown) => Promise<T>;
  put: <T>(endpoint: string, data?: unknown) => Promise<T>;
  delete: <T>(endpoint: string) => Promise<T>;
}

interface AuthFixture {
  loginAs: (email: string, password: string) => Promise<{ token: string; user: { id: string; email: string } }>;
  logout: () => Promise<void>;
}

interface CleanupFixture {
  trackResource: (endpoint: string, id: string) => void;
}

// ============================================
// Fixtures
// ============================================

/**
 * API Request Fixture
 * Provides typed API methods for test setup/assertions
 */
const apiFixture = base.extend<{ api: ApiFixture }>({
  api: async ({ request }, use) => {
    const makeRequest = async <T>(method: HttpMethod, endpoint: string, data?: unknown): Promise<T> => {
      return apiRequest<T>({ request, method, endpoint, data });
    };

    await use({
      get: <T>(endpoint: string) => makeRequest<T>('GET', endpoint),
      post: <T>(endpoint: string, data?: unknown) => makeRequest<T>('POST', endpoint, data),
      put: <T>(endpoint: string, data?: unknown) => makeRequest<T>('PUT', endpoint, data),
      delete: <T>(endpoint: string) => makeRequest<T>('DELETE', endpoint),
    });
  },
});

/**
 * Auth Fixture
 * Handles login/logout via API with localStorage injection (Zustand persist)
 */
const authFixture = base.extend<{ auth: AuthFixture }>({
  auth: async ({ request, context }, use) => {
    let currentToken: string | null = null;

    const loginAs = async (email: string, password: string) => {
      const result = await loginUser(request, { email, password });
      currentToken = result.token;

      // Inject auth state into localStorage (Zustand persist format)
      const authState = {
        state: {
          token: result.token,
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      };

      await context.addInitScript((authStateStr: string) => {
        window.localStorage.setItem('auth-storage', authStateStr);
      }, JSON.stringify(authState));

      return result;
    };

    const logout = async () => {
      currentToken = null;
      await context.addInitScript(() => {
        window.localStorage.removeItem('auth-storage');
      });
    };

    await use({ loginAs, logout });

    // Cleanup on fixture teardown
    if (currentToken) {
      await context.addInitScript(() => {
        window.localStorage.removeItem('auth-storage');
      });
    }
  },
});

/**
 * Cleanup Fixture
 * Tracks created resources for automatic cleanup after test
 */
const cleanupFixture = base.extend<{ cleanup: CleanupFixture; _cleanupToken: string }>({
  _cleanupToken: ['', { option: true }],

  cleanup: async ({ request, _cleanupToken }, use) => {
    const trackedResources: Array<{ endpoint: string; id: string }> = [];

    const trackResource = (endpoint: string, id: string) => {
      trackedResources.push({ endpoint, id });
    };

    await use({ trackResource });

    // Auto-cleanup all tracked resources
    if (trackedResources.length > 0 && _cleanupToken) {
      await cleanupResources(request, _cleanupToken, trackedResources);
    }
  },
});

/**
 * Authenticated User Fixture
 * Creates a test user, logs in, and provides user data to test
 *
 * IMPORTANT: Frontend uses Zustand persist with localStorage (key: 'auth-storage')
 * We inject the auth state via addInitScript before any page loads
 */
const authenticatedUserFixture = base.extend<{ authenticatedUser: TestUser }>({
  authenticatedUser: async ({ request, context, page }, use) => {
    // Generate unique test user
    const timestamp = Date.now();
    const userData = {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`,
    };

    // Create user via API
    let userId: string;
    try {
      const created = await seedUser(request, userData);
      userId = created.id;
    } catch {
      // User might already exist in some test scenarios
      userId = '';
    }

    // Login to get token
    const { token, user } = await loginUser(request, {
      email: userData.email,
      password: userData.password,
    });

    // Inject auth state into localStorage (Zustand persist format)
    // This must be done BEFORE navigating to any page
    const authState = {
      state: {
        token,
        user: {
          id: userId || user.id,
          email: userData.email,
        },
        isAuthenticated: true,
        isLoading: false,
      },
      version: 0,
    };

    // Add init script to inject auth state before page loads
    await context.addInitScript((authStateStr: string) => {
      window.localStorage.setItem('auth-storage', authStateStr);
    }, JSON.stringify(authState));

    const testUser: TestUser = {
      id: userId || user.id,
      email: userData.email,
      name: userData.name,
      password: userData.password,
      token,
    };

    await use(testUser);

    // Cleanup: clear localStorage auth state
    await context.addInitScript(() => {
      window.localStorage.removeItem('auth-storage');
    });
  },
});

// ============================================
// Merged Test Export
// ============================================

/**
 * Merged test with all fixtures
 * Import this in your tests for full capabilities
 */
export const test = mergeTests(
  base,
  apiFixture,
  authFixture,
  cleanupFixture,
  authenticatedUserFixture,
);

export { expect };

// Re-export types for test files
export type { TestUser, ApiFixture, AuthFixture, CleanupFixture };
