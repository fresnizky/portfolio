import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { DashboardPosition, AssetCategory } from '@/types/api'

interface AllocationChartProps {
  positions: DashboardPosition[]
}

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  ETF: '#3b82f6',      // blue-500
  FCI: '#8b5cf6',      // violet-500
  CRYPTO: '#f59e0b',   // amber-500
  CASH: '#10b981',     // emerald-500
}

interface ChartDataItem {
  name: string
  value: number
  category: AssetCategory
}

export function AllocationChart({ positions }: AllocationChartProps) {
  if (positions.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-gray-500">No assets to display</p>
      </div>
    )
  }

  const chartData: ChartDataItem[] = positions.map((pos) => ({
    name: pos.ticker,
    value: parseFloat(pos.actualPercentage),
    category: pos.category,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData as unknown as Record<string, unknown>[]}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={({ name, value }) => `${name || ''}: ${(value as number).toFixed(1)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Allocation']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
