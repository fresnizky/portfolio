import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(value: string | number, currency = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

export function formatPercentage(value: string | number, decimals = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return `${numValue.toFixed(decimals)}%`
}

export function formatDate(
  dateString: string,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const date = new Date(dateString)

  const formats: Record<string, string> = {
    short: 'dd/MM',
    medium: 'dd MMM yyyy',
    long: 'dd MMMM yyyy',
    full: "dd MMM yyyy, HH:mm",
  }

  return format(date, formats[style], { locale: es })
}

export function formatGrowth(startValue: number, endValue: number): {
  absolute: number
  percentage: number
  isPositive: boolean
} {
  const absolute = endValue - startValue
  const percentage = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0

  return {
    absolute,
    percentage,
    isPositive: absolute >= 0,
  }
}

/**
 * Format quantity with appropriate decimal precision
 * @param quantity - String representation of quantity from API
 * @param decimalPlaces - Optional explicit decimal places from asset configuration.
 *                        When provided, formats to this precision and removes trailing zeros.
 *                        When omitted, falls back to inference from string value.
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string, decimalPlaces?: number): string {
  const num = parseFloat(quantity)
  if (Number.isNaN(num)) return '0'

  // If decimalPlaces explicitly provided, use it
  if (decimalPlaces !== undefined) {
    // Use Intl.NumberFormat for automatic trailing zero handling
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    }).format(num)
  }

  // Fallback: infer from string value (backward compatibility)
  if (Number.isInteger(num)) return num.toString()

  // Show actual precision up to 8 decimals
  const decimalPart = quantity.split('.')[1] || ''
  const precision = Math.min(8, decimalPart.length)
  return num.toFixed(precision)
}
