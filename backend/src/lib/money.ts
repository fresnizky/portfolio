/**
 * Money utilities for converting between decimal prices and cents (BigInt)
 * All monetary values are stored as cents (BigInt) to avoid floating-point errors
 */

/**
 * Convert decimal price to cents (BigInt)
 * e.g., 450.75 -> 45075n
 */
export const toCents = (price: number): bigint => {
  return BigInt(Math.round(price * 100))
}

/**
 * Convert cents to decimal string
 * e.g., 45075n -> "450.75"
 */
export const fromCents = (cents: bigint): string => {
  const value = Number(cents) / 100
  return value.toFixed(2)
}

/**
 * Convert cents to decimal string, with null support
 * e.g., 45075n -> "450.75", null -> null
 */
export const fromCentsNullable = (cents: bigint | null): string | null => {
  if (cents === null) return null
  return fromCents(cents)
}
