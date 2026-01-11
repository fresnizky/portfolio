import type { APIRequestContext } from '@playwright/test';

/**
 * API Helper Functions
 *
 * Pure functions for API interactions. Used by fixtures for seeding and cleanup.
 * Pattern: Pure function → Fixture wrapper (TEA fixture-architecture)
 */

const API_URL = process.env.API_URL || 'http://localhost:10002';

// ============================================
// Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestParams {
  request: APIRequestContext;
  method: HttpMethod;
  endpoint: string;
  data?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

// ============================================
// Core API Request Function
// ============================================

/**
 * Make an API request with proper error handling
 * @throws Error if response is not ok
 */
export async function apiRequest<T>({
  request,
  method,
  endpoint,
  data,
  headers = {},
  token,
}: ApiRequestParams): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await request.fetch(url, {
    method,
    data,
    headers: requestHeaders,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`API ${method} ${endpoint} failed: ${response.status()} ${errorText}`);
  }

  const contentType = response.headers()['content-type'];
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

// ============================================
// Seeding Helpers
// ============================================

/**
 * Seed a user via API
 */
export async function seedUser(
  request: APIRequestContext,
  userData: {
    email: string;
    password: string;
    name?: string;
  },
): Promise<{ id: string; email: string; name: string }> {
  const response = await apiRequest<ApiResponse<{ id: string; email: string; name: string }>>({
    request,
    method: 'POST',
    endpoint: '/api/auth/register',
    data: userData,
  });

  return response.data;
}

/**
 * Login and get auth token
 */
export async function loginUser(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<{ token: string; user: { id: string; email: string } }> {
  const response = await apiRequest<ApiResponse<{ token: string; user: { id: string; email: string } }>>({
    request,
    method: 'POST',
    endpoint: '/api/auth/login',
    data: credentials,
  });

  return response.data;
}

/**
 * Seed an asset via API
 */
export async function seedAsset(
  request: APIRequestContext,
  token: string,
  assetData: {
    ticker: string;
    name: string;
    type: string;
    currency?: string;
  },
): Promise<{ id: string; ticker: string; name: string }> {
  const response = await apiRequest<ApiResponse<{ id: string; ticker: string; name: string }>>({
    request,
    method: 'POST',
    endpoint: '/api/assets',
    data: assetData,
    token,
  });

  return response.data;
}

/**
 * Seed a transaction via API
 */
export async function seedTransaction(
  request: APIRequestContext,
  token: string,
  transactionData: {
    assetId: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    pricePerUnit: number;
    currency: string;
    date: string;
  },
): Promise<{ id: string }> {
  const response = await apiRequest<ApiResponse<{ id: string }>>({
    request,
    method: 'POST',
    endpoint: '/api/transactions',
    data: transactionData,
    token,
  });

  return response.data;
}

// ============================================
// Cleanup Helpers
// ============================================

/**
 * Delete a resource by ID
 */
export async function deleteResource(
  request: APIRequestContext,
  token: string,
  endpoint: string,
  id: string,
): Promise<void> {
  await apiRequest({
    request,
    method: 'DELETE',
    endpoint: `${endpoint}/${id}`,
    token,
  });
}

/**
 * Cleanup multiple resources
 */
export async function cleanupResources(
  request: APIRequestContext,
  token: string,
  resources: Array<{ endpoint: string; id: string }>,
): Promise<void> {
  for (const { endpoint, id } of resources) {
    try {
      await deleteResource(request, token, endpoint, id);
    } catch {
      // Ignore cleanup errors (resource may already be deleted)
    }
  }
}
