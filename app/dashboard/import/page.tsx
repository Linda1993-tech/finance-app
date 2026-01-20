import { ImportForm } from './import-form'

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Import Transactions
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Upload CSV (ING NL) or XLS/XLSX (ING ES) files
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upload Bank File
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Select your bank and upload the file. We'll automatically parse and import
              your transactions.
            </p>
          </div>

          <div className="p-6">
            <ImportForm />
          </div>

          {/* Format Help */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📋 Supported Formats
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong className="text-gray-900 dark:text-white">ING NL (CSV):</strong>
                <p className="ml-4">
                  Expected columns: Date, Description/Name, Amount
                </p>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">ING ES (XLS/XLSX):</strong>
                <p className="ml-4">
                  Expected columns: Fecha, Concepto/Descripción, Importe
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              💡 Tip: If import fails, make sure your file has headers and the column
              names match the expected format.
            </p>
          </div>
        </div>

        {/* View Transactions Link */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard/transactions"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All Transactions →
          </a>
        </div>
      </main>
    </div>
  )
}

