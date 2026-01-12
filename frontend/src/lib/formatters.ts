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
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = new Date(dateString)

  const formats: Record<string, string> = {
    short: 'dd/MM',
    medium: 'dd MMM yyyy',
    long: 'dd MMMM yyyy',
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
