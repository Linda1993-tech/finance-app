import { getCategorizationRules } from '../transactions/categorization-actions'
import { getTransactions } from '../import/actions'
import { getCategories } from '../categories/actions'
import { CreateRuleForm } from './create-rule-form'

export default async function RulesPage() {
  const rules = await getCategorizationRules()
  const transactions = await getTransactions()
  const categories = await getCategories()

  // Count how many transactions match each rule
  const rulesWithCounts = rules.map((rule) => ({
    ...rule,
    matchingCount: transactions.filter(
      (t) => t.learning_key === rule.learning_key && !t.category_id
    ).length,
  }))

  const uncategorizedTransactions = transactions.filter((t) => !t.category_id)
  const uncategorizedWithKeys = uncategorizedTransactions.filter((t) => t.learning_key)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Learning Rules
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {rules.length} rules • {uncategorizedWithKeys.length} uncategorized transactions
                with learning keys
              </p>
            </div>
            <a
              href="/dashboard/transactions"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Transactions
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Create Rule Form */}
        <CreateRuleForm categories={categories} />
        {/* Rules Table */}
        {rules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No learning rules yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Categorize a transaction with "Always create rule" to create your first rule
            </p>
            <a
              href="/dashboard/transactions"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Transactions
            </a>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Learning Rules
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Learning Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Matches
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rulesWithCounts.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-300">
                          {rule.learning_key}
                        </code>
                        {rule.learning_key.includes(':') && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {rule.learning_key.startsWith('contains:') && '📍 Contains'}
                            {rule.learning_key.startsWith('starts_with:') && '▶️ Starts with'}
                            {rule.learning_key.startsWith('exact:') && '🎯 Exact match'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {rule.category?.icon && <span>{rule.category.icon}</span>}
                          <span className="text-gray-900 dark:text-gray-300">
                            {rule.category?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {rule.confidence}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rule.matchingCount > 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {rule.matchingCount} transactions
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">No matches</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Uncategorized Transactions Sample */}
        {uncategorizedWithKeys.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Uncategorized Transactions (Sample)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Showing up to 20 transactions that could be auto-categorized
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Learning Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Has Rule?
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {uncategorizedWithKeys.slice(0, 20).map((transaction) => {
                    const hasRule = rules.some((r) => r.learning_key === transaction.learning_key)
                    return (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          <div>{transaction.description}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {transaction.normalized_description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-300">
                            {transaction.learning_key}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasRule ? (
                            <span className="text-green-600 dark:text-green-400">✅ Yes</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">❌ No</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

