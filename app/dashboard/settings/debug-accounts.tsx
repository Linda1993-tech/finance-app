'use client'

export function DebugAccounts({ debug }: { debug: any }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
      <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">🔍 Debug Info</h3>
      <pre className="text-xs overflow-auto max-h-60 bg-white dark:bg-gray-800 p-3 rounded">
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  )
}
