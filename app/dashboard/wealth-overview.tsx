import { formatEuro } from '@/lib/utils/currency-format'
import type { WealthOverview } from './wealth-actions'

type Props = {
  wealth: WealthOverview
}

export function WealthOverviewCard({ wealth }: Props) {
  const breakdown = [
    {
      label: 'Savings',
      value: wealth.savings,
      icon: '🏦',
      color: 'text-blue-600 dark:text-blue-400',
      href: '/dashboard/savings',
    },
    {
      label: 'Pension',
      value: wealth.pension,
      icon: '💼',
      color: 'text-purple-600 dark:text-purple-400',
      href: '/dashboard/pension',
    },
    {
      label: 'Stocks',
      value: wealth.stocks,
      icon: '📈',
      color: 'text-green-600 dark:text-green-400',
      href: '/dashboard/stocks',
    },
    {
      label: 'Current Account',
      value: wealth.currentAccount,
      icon: '💳',
      color: 'text-orange-600 dark:text-orange-400',
      href: '/dashboard/transactions',
    },
  ]

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white col-span-full">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">💎</span>
        <div>
          <h2 className="text-lg font-medium opacity-90">Total Net Worth</h2>
          <p className="text-4xl font-bold">{formatEuro(wealth.totalNetWorth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {breakdown.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm opacity-90">{item.label}</span>
            </div>
            <p className="text-xl font-semibold">{formatEuro(item.value)}</p>
            <p className="text-xs opacity-75 mt-1">
              {wealth.totalNetWorth > 0
                ? `${((item.value / wealth.totalNetWorth) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
