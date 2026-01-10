import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Snapshot } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface ChartDataPoint {
  date: string
  value: number
  formattedDate: string
  formattedValue: string
}

interface EvolutionChartProps {
  snapshots: Snapshot[]
  isLoading?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartDataPoint }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null

  const { formattedDate, formattedValue } = payload[0].payload
  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg">
      <p className="text-sm text-gray-500">{formattedDate}</p>
      <p className="text-lg font-semibold">{formattedValue}</p>
    </div>
  )
}

export function EvolutionChart({ snapshots, isLoading }: EvolutionChartProps) {
  // Transform snapshots to chart data (sorted by date asc for chart)
  const data: ChartDataPoint[] = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: s.date,
      value: parseFloat(s.totalValue),
      formattedDate: formatDate(s.date, 'medium'),
      formattedValue: formatCurrency(s.totalValue),
    }))

  if (isLoading) {
    return <div className="h-80 animate-pulse bg-gray-200 rounded" />
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No hay datos de evolución aún. Los snapshots se crean cuando actualizas precios.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value).replace('$', '')}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
