import type { Currency } from '@/types/api'

interface CurrencyToggleProps {
  value: Currency
  onChange: (currency: Currency) => void
}

const currencies: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'ARS', label: 'ARS' },
]

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex rounded-lg border p-1 gap-1">
      {currencies.map((currency) => (
        <button
          key={currency.value}
          onClick={() => onChange(currency.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === currency.value
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {currency.label}
        </button>
      ))}
    </div>
  )
}
