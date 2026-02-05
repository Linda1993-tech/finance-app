'use client'

import { useState, useEffect } from 'react'
import { MonthlyTrendsChart, CategoryBreakdownChart, TopCategoriesChart } from './charts'
import { AnalyticsFilters, type AnalyticsFilters as Filters } from './filters'
import type { MonthlyData, CategorySpending } from './data-actions'
import type { Category } from '@/lib/types/database'
import { formatEuro } from '@/lib/utils/currency-format'

type Props = {
  initialMonthlyTrends: MonthlyData[]
  initialCategorySpending: CategorySpending[]
  initialCurrentMonthSpending: CategorySpending[]
  categories: Category[]
  currentMonth: {
    month: string
    income: number
    expenses: number
    net: number
    transactionCount: number
  }
}

export function AnalyticsClient({
  initialMonthlyTrends,
  initialCategorySpending,
  initialCurrentMonthSpending,
  categories,
  currentMonth,
}: Props) {
  const [filters, setFilters] = useState<Filters>({ dateRange: '12', specificMonth: null })
  const [monthlyData, setMonthlyData] = useState(initialMonthlyTrends)
  const [categoryData, setCategoryData] = useState(initialCategorySpending)
  const [currentMonthData, setCurrentMonthData] = useState(initialCurrentMonthSpending)

  // Apply filters
  useEffect(() => {
    // Filter monthly trends by date range or specific month
    let filteredMonthly = initialMonthlyTrends
    
    if (filters.specificMonth) {
      // Show only the specific month
      filteredMonthly = filteredMonthly.filter(m => m.month === filters.specificMonth)
    } else if (filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
      const months = parseInt(filters.dateRange)
      filteredMonthly = filteredMonthly.slice(-months)
    }
    setMonthlyData(filteredMonthly)

    // Fetch category data based on filter selection
    async function fetchCategoryData() {
      if (filters.specificMonth) {
        // Fetch data for specific month
        try {
          const response = await fetch(`/api/analytics/category-spending?month=${filters.specificMonth}`)
          const monthData = await response.json()
          setCurrentMonthData(monthData)
          setCategoryData(monthData)
        } catch (error) {
          console.error('Error fetching month data:', error)
        }
      } else {
        // For period filters, use all-time category data
        setCategoryData(initialCategorySpending)
        setCurrentMonthData(initialCategorySpending)
      }
    }

    fetchCategoryData()
  }, [filters, initialMonthlyTrends, initialCategorySpending, initialCurrentMonthSpending, categories])

  // Calculate month-over-month change
  const previousMonth = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2] : null
  const currentMonthFromData = monthlyData.length >= 1 ? monthlyData[monthlyData.length - 1] : null
  
  const expenseChange = previousMonth && currentMonthFromData
    ? ((currentMonthFromData.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    : 0

  const incomeChange = previousMonth && currentMonthFromData
    ? ((currentMonthFromData.income - previousMonth.income) / previousMonth.income) * 100
    : 0

  // Calculate display data based on filter selection
  const displayMonth = filters.specificMonth 
    ? initialMonthlyTrends.find(m => m.month === filters.specificMonth) || currentMonth
    : monthlyData.length > 0
    ? {
        month: monthlyData[monthlyData.length - 1].month, // Most recent month in filtered data
        income: monthlyData.reduce((sum, m) => sum + m.income, 0), // TOTAL income (not average)
        expenses: monthlyData.reduce((sum, m) => sum + m.expenses, 0), // TOTAL expenses (not average)
        net: monthlyData.reduce((sum, m) => sum + m.net, 0), // TOTAL net (not average)
        transactionCount: 0
      }
    : currentMonth
  
  // Determine the period label for display
  const periodLabel = filters.specificMonth
    ? new Date(filters.specificMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : filters.dateRange === '12'
    ? `Current Year (${new Date().getFullYear()})`
    : filters.dateRange === 'all'
    ? 'All Time'
    : `Last ${filters.dateRange} Months`

  // Calculate averages
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0
  const avgDailyExpense = avgMonthlyExpense / 30
  const avgWeeklyExpense = avgMonthlyExpense / 4.33

  // Generate available months from actual data
  const availableMonths = initialMonthlyTrends.map((m) => ({
    value: m.month,
    label: new Date(m.month + '-01').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  })).reverse() // Most recent first

  return (
    <>
      {/* Filters */}
      <AnalyticsFilters 
        categories={categories} 
        availableMonths={availableMonths}
        onFilterChange={setFilters} 
      />

      {/* Summary Cards with Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Period/Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filters.specificMonth ? 'Selected Month' : 'Period'}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {periodLabel}
          </div>
          {previousMonth && filters.specificMonth && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              vs {new Date(previousMonth.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
            </div>
          )}
          {!filters.specificMonth && monthlyData.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total for {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Income</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatEuro(displayMonth.income)}
          </div>
          {previousMonth && incomeChange !== 0 && (
            <div
              className={`text-xs mt-2 flex items-center gap-1 ${
                incomeChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% vs last month
            </div>
          )}
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Expenses</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {formatEuro(displayMonth.expenses)}
          </div>
          {previousMonth && expenseChange !== 0 && (
            <div
              className={`text-xs mt-2 flex items-center gap-1 ${
                expenseChange >= 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs last month
            </div>
          )}
        </div>

        {/* Net */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Net</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              displayMonth.net >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatEuro(displayMonth.net)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {displayMonth.net >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>
      </div>

      {/* Averages Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Average Spending</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm opacity-90">Per Month</div>
            <div className="text-2xl font-bold">{formatEuro(avgMonthlyExpense)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Per Week</div>
            <div className="text-2xl font-bold">{formatEuro(avgWeeklyExpense)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Per Day</div>
            <div className="text-2xl font-bold">{formatEuro(avgDailyExpense)}</div>
          </div>
        </div>
        <div className="text-xs opacity-75 mt-3">
          Based on {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''} of data
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Income vs Expenses Trend
        </h2>
        <MonthlyTrendsChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {filters.specificMonth 
              ? `${new Date(filters.specificMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} by Category`
              : 'Current Month by Category'}
          </h2>
          <CategoryBreakdownChart data={currentMonthData} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Spending Categories
            {filters.specificMonth && ` (${new Date(filters.specificMonth + '-01').toLocaleDateString('en-US', { month: 'short' })})`}
          </h2>
          <div className="space-y-3">
            {currentMonthData.slice(0, 10).map((cat, index) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6">
                    {index + 1}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cat.color || '#6B7280' }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {cat.icon} {cat.category}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.count} transactions
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatEuro(cat.amount)}
                </div>
              </div>
            ))}
            {currentMonthData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No expenses for selected filters
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Top 10 Categories
          {filters.dateRange === 'all' ? ' (All Time)' : ` (Last ${filters.dateRange} months)`}
        </h2>
        <TopCategoriesChart data={categoryData} limit={10} />
      </div>
    </>
  )
}

