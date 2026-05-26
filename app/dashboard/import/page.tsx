import { ImportForm } from './import-form'
import { getAccountTypeFixData } from '../transactions/actions'
import { FixAccountTypePanel } from '../transactions/fix-account-type-panel'

export default async function ImportPage() {
  const fixData = await getAccountTypeFixData()

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
                Upload CSV of XLS/XLSX bestanden — de app herkent automatisch welke rekening het is
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
              Upload je bankafschrift. We herkennen automatisch of het je Nederlandse of Spaanse
              rekening betreft en importeren de transacties.
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
                <strong className="text-gray-900 dark:text-white">🇳🇱 Dutch Bank Format:</strong>
                <p className="ml-4">
                  Supports CSV or XLSX format<br />
                  Expected columns: Datum, Naam/Omschrijving, Bedrag (EUR), Af Bij<br />
                  <span className="text-xs text-gray-500">(Works with ING, ABN AMRO, Rabobank, etc.)</span>
                </p>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">🇪🇸 Spanish Bank Format:</strong>
                <p className="ml-4">
                  Supports CSV or XLSX format<br />
                  Expected columns: F. VALOR, DESCRIPCIÓN, IMPORTE (€)<br />
                  <span className="text-xs text-gray-500">(Works with ING, BBVA, Santander, etc.)</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              💡 Tip: je hoeft niet meer handmatig te kiezen tussen NL en ES. De app herkent het
              accounttype aan de hand van de kolomnamen in het bestand (bijv. Datum/Bedrag voor NL,
              F. VALOR/IMPORTE voor ES).
            </p>
          </div>
        </div>

        <div className="mt-6">
          <FixAccountTypePanel data={fixData} />
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

