'use client'

import { useState } from 'react'
import { importBankStatement } from './actions'

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const acceptedFileTypes = '.csv,.xls,.xlsx'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const importResult = await importBankStatement(formData)

      if (importResult.success) {
        const accountLabel =
          importResult.accountType === 'spanish'
            ? '🇪🇸 Spaanse rekening'
            : '🇳🇱 Nederlandse rekening'

        let message = `✅ ${importResult.count} nieuwe transactie${importResult.count === 1 ? '' : 's'} geïmporteerd (${accountLabel})`

        if (importResult.duplicates && importResult.duplicates > 0) {
          message += ` — ${importResult.duplicates} duplicaat${importResult.duplicates === 1 ? '' : 'en'} overgeslagen`
        }

        setResult({
          type: 'success',
          message,
        })
        setFile(null)
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
      } else {
        setResult({
          type: 'error',
          message: `❌ Fout: ${importResult.error}`,
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Onverwachte fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="file-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Bankafschrift uploaden
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Upload een CSV of XLS/XLSX bestand. De app herkent automatisch of het je Nederlandse of
          Spaanse rekening betreft.
        </p>
        <div className="flex items-center gap-4">
          <input
            id="file-input"
            type="file"
            accept={acceptedFileTypes}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
          />
        </div>
        {file && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Geselecteerd: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <p
            className={`text-sm ${
              result.type === 'success'
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}
          >
            {result.message}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isUploading ? 'Importeren...' : 'Transacties importeren'}
      </button>
    </form>
  )
}
