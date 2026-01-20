import { getTransactions } from '../import/actions'
import { getCategories } from '../categories/actions'
import { TransactionList } from './transaction-list'
import { DeleteAllButton } from './delete-button'
import { AutoCategorizeButton } from './auto-categorize-button'

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  const categories = await getCategories()

  const uncategorizedCount = transactions.filter((t) => !t.category_id).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Transactions
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {transactions.length} transactions imported
              </p>
            </div>
            <div className="flex gap-3">
              {uncategorizedCount > 0 && <AutoCategorizeButton count={uncategorizedCount} />}
              <a
                href="/dashboard/import"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                + Import
              </a>
              {transactions.length > 0 && <DeleteAllButton />}
              <a
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {transactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Import your first CSV or XLSX file to get started
            </p>
            <a
              href="/dashboard/import"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Import Transactions
            </a>
          </div>
        ) : (
          <TransactionList transactions={transactions} categories={categories} />
        )}
      </main>
    </div>
  )
}

