/**
 * Count the number of decimal places in a number
 * Handles regular decimals and scientific notation (e.g., 1e-8)
 *
 * @param value - The number to analyze
 * @returns Number of decimal places
 */
export function countDecimalPlaces(value: number): number {
  if (Number.isInteger(value)) return 0

  const str = value.toString()

  // Handle scientific notation (e.g., 1e-8, 1.2e-8)
  if (str.includes('e-')) {
    const [mantissa, exponent] = str.split('e-')
    const exp = parseInt(exponent, 10)

    // Count decimals in mantissa (e.g., "1.2" has 1 decimal)
    const mantissaParts = mantissa.split('.')
    const mantissaDecimals = mantissaParts[1]?.length ?? 0

    // Total decimals = exponent + mantissa decimals
    return exp + mantissaDecimals
  }

  // Regular decimal number
  const parts = str.split('.')
  return parts[1]?.length ?? 0
}
