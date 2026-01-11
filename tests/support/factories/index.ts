/**
 * Portfolio Tracker - Data Factories
 *
 * Factory functions with sensible defaults and explicit overrides.
 * Pattern: createEntity(overrides) → complete object
 *
 * Benefits:
 * - Parallel-safe: unique IDs prevent collisions
 * - Schema evolution: update factory once, all tests work
 * - Explicit intent: overrides show what matters for each test
 *
 * @see TEA data-factories knowledge base
 */

// ============================================
// Types (matching Prisma schema)
// ============================================

export type AssetCategory = 'ETF' | 'FCI' | 'CRYPTO' | 'CASH';
export type TransactionType = 'BUY' | 'SELL';
export type Currency = 'USD' | 'ARS';

export interface UserData {
  email: string;
  password: string;
  name?: string;
  onboardingCompleted?: boolean;
  rebalanceThreshold?: number;
  priceAlertDays?: number;
}

export interface AssetData {
  ticker: string;
  name: string;
  category: AssetCategory;
  currency?: Currency;
  targetPercentage?: number;
  currentPriceCents?: number;
}

export interface TransactionData {
  assetId: string;
  type: TransactionType;
  date: string; // ISO string
  quantity: number;
  priceCents: number;
  commissionCents?: number;
}

export interface HoldingData {
  assetId: string;
  quantity: number;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate unique ID for parallel-safe test data
 */
function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique email
 */
function uniqueEmail(): string {
  return `test-${uniqueId()}@example.com`;
}

/**
 * Generate random number in range
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random element from array
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate ISO date string for N days ago
 */
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// ============================================
// User Factories
// ============================================

/**
 * Create user data with sensible defaults
 * @example
 * const user = createUser(); // Default user
 * const admin = createUser({ email: 'admin@example.com' }); // Specific email
 */
export function createUser(overrides: Partial<UserData> = {}): UserData {
  return {
    email: uniqueEmail(),
    password: 'TestPassword123!',
    name: `Test User ${uniqueId().slice(0, 6)}`,
    onboardingCompleted: false,
    rebalanceThreshold: 5.0,
    priceAlertDays: 7,
    ...overrides,
  };
}

/**
 * Create user with completed onboarding
 */
export function createOnboardedUser(overrides: Partial<UserData> = {}): UserData {
  return createUser({
    onboardingCompleted: true,
    ...overrides,
  });
}

// ============================================
// Asset Factories
// ============================================

const SAMPLE_ETFS = [
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF' },
];

const SAMPLE_CRYPTO = [
  { ticker: 'BTC', name: 'Bitcoin' },
  { ticker: 'ETH', name: 'Ethereum' },
  { ticker: 'SOL', name: 'Solana' },
];

const SAMPLE_FCI = [
  { ticker: 'CEDEAR-VOO', name: 'CEDEAR Vanguard S&P 500' },
  { ticker: 'CEDEAR-SPY', name: 'CEDEAR SPDR S&P 500' },
];

/**
 * Create asset data with sensible defaults
 * @example
 * const asset = createAsset(); // Random ETF
 * const btc = createAsset({ ticker: 'BTC', category: 'CRYPTO' }); // Specific
 */
export function createAsset(overrides: Partial<AssetData> = {}): AssetData {
  const sample = randomElement(SAMPLE_ETFS);

  return {
    ticker: `${sample.ticker}-${uniqueId().slice(0, 4)}`,
    name: sample.name,
    category: 'ETF',
    currency: 'USD',
    targetPercentage: randomInt(5, 30),
    currentPriceCents: randomInt(10000, 50000), // $100-$500
    ...overrides,
  };
}

/**
 * Create ETF asset
 */
export function createETF(overrides: Partial<AssetData> = {}): AssetData {
  const sample = randomElement(SAMPLE_ETFS);
  return createAsset({
    ticker: `${sample.ticker}-${uniqueId().slice(0, 4)}`,
    name: sample.name,
    category: 'ETF',
    currency: 'USD',
    ...overrides,
  });
}

/**
 * Create crypto asset
 */
export function createCrypto(overrides: Partial<AssetData> = {}): AssetData {
  const sample = randomElement(SAMPLE_CRYPTO);
  return createAsset({
    ticker: `${sample.ticker}-${uniqueId().slice(0, 4)}`,
    name: sample.name,
    category: 'CRYPTO',
    currency: 'USD',
    currentPriceCents: randomInt(100000, 5000000), // $1,000-$50,000
    ...overrides,
  });
}

/**
 * Create cash position (USD or ARS)
 */
export function createCash(currency: Currency = 'USD', overrides: Partial<AssetData> = {}): AssetData {
  return createAsset({
    ticker: currency,
    name: currency === 'USD' ? 'US Dollar' : 'Argentine Peso',
    category: 'CASH',
    currency,
    currentPriceCents: 100, // $1.00
    ...overrides,
  });
}

// ============================================
// Transaction Factories
// ============================================

/**
 * Create transaction data
 * @example
 * const buy = createTransaction({ assetId: 'xxx', type: 'BUY' });
 * const sell = createTransaction({ assetId: 'xxx', type: 'SELL', quantity: 5 });
 */
export function createTransaction(overrides: Partial<TransactionData> & { assetId: string }): TransactionData {
  const quantity = overrides.quantity || randomInt(1, 100);
  const priceCents = overrides.priceCents || randomInt(10000, 50000);

  return {
    assetId: overrides.assetId,
    type: 'BUY',
    date: daysAgo(randomInt(1, 365)),
    quantity,
    priceCents,
    commissionCents: 0,
    ...overrides,
  };
}

/**
 * Create buy transaction
 */
export function createBuyTransaction(
  assetId: string,
  overrides: Partial<Omit<TransactionData, 'assetId' | 'type'>> = {},
): TransactionData {
  return createTransaction({
    assetId,
    type: 'BUY',
    ...overrides,
  });
}

/**
 * Create sell transaction
 */
export function createSellTransaction(
  assetId: string,
  overrides: Partial<Omit<TransactionData, 'assetId' | 'type'>> = {},
): TransactionData {
  return createTransaction({
    assetId,
    type: 'SELL',
    ...overrides,
  });
}

// ============================================
// Portfolio Factories (Composed)
// ============================================

/**
 * Create a complete portfolio setup for testing
 * Returns user + assets ready for seeding
 */
export function createPortfolio(config: {
  assetCount?: number;
  includeCategories?: AssetCategory[];
} = {}): {
  user: UserData;
  assets: AssetData[];
} {
  const { assetCount = 3, includeCategories = ['ETF', 'CRYPTO'] } = config;

  const user = createOnboardedUser();
  const assets: AssetData[] = [];

  for (let i = 0; i < assetCount; i++) {
    const category = includeCategories[i % includeCategories.length];

    if (category === 'ETF') {
      assets.push(createETF({ targetPercentage: Math.floor(100 / assetCount) }));
    } else if (category === 'CRYPTO') {
      assets.push(createCrypto({ targetPercentage: Math.floor(100 / assetCount) }));
    } else if (category === 'CASH') {
      assets.push(createCash('USD', { targetPercentage: Math.floor(100 / assetCount) }));
    } else {
      assets.push(createAsset({ category, targetPercentage: Math.floor(100 / assetCount) }));
    }
  }

  return { user, assets };
}

// ============================================
// Test Data Scenarios
// ============================================

/**
 * Create a diversified portfolio for dashboard tests
 */
export function createDiversifiedPortfolio(): {
  user: UserData;
  assets: AssetData[];
} {
  return {
    user: createOnboardedUser(),
    assets: [
      createETF({ ticker: 'VOO-TEST', targetPercentage: 40 }),
      createETF({ ticker: 'VTI-TEST', targetPercentage: 30 }),
      createCrypto({ ticker: 'BTC-TEST', targetPercentage: 20 }),
      createCash('USD', { ticker: 'USD-TEST', targetPercentage: 10 }),
    ],
  };
}

/**
 * Create portfolio with rebalancing need (assets off target)
 */
export function createUnbalancedPortfolio(): {
  user: UserData;
  assets: AssetData[];
  description: string;
} {
  return {
    user: createOnboardedUser({ rebalanceThreshold: 5.0 }),
    assets: [
      // Target 50%, but will simulate actual 60% (10% over)
      createETF({ ticker: 'VOO-OVER', name: 'Overweight ETF', targetPercentage: 50 }),
      // Target 50%, but will simulate actual 40% (10% under)
      createCrypto({ ticker: 'BTC-UNDER', name: 'Underweight Crypto', targetPercentage: 50 }),
    ],
    description: 'Portfolio with 10% deviation from targets (exceeds 5% threshold)',
  };
}
