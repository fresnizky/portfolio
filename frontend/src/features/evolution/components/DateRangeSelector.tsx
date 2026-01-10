import type { DateRangePeriod } from '../utils'

interface DateRangeSelectorProps {
  value: DateRangePeriod
  onChange: (period: DateRangePeriod) => void
}

const periods: { value: DateRangePeriod; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'Todo' },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border p-1 gap-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === period.value
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
