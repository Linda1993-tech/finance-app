'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyData, CategorySpending } from './data-actions'

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
]

type MonthlyTrendsChartProps = {
  data: MonthlyData[]
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No data for the selected period" />
  }

  // Format month labels (Jan 2026, Feb 2026, etc.)
  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: new Date(d.month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthLabel" />
        <YAxis />
        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#10B981"
          strokeWidth={2}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          strokeWidth={2}
          name="Expenses"
        />
        <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  )
}

type CategoryBreakdownChartProps = {
  data: CategorySpending[]
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No expenses to show" />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}

type TopCategoriesChartProps = {
  data: CategorySpending[]
  limit?: number
}

export function TopCategoriesChart({ data, limit = 10 }: TopCategoriesChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No expenses to show" />
  }

  const topData = data.slice(0, limit)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="category" type="category" width={150} />
        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
        <Bar dataKey="amount" fill="#3B82F6">
          {topData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p>{message}</p>
      </div>
    </div>
  )
}

