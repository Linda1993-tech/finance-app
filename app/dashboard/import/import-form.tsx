'use client'

import { useState } from 'react'
import { importCSV, importXLSX } from './actions'

type BankType = 'ING_NL' | 'ING_ES'

export function ImportForm() {
  const [bank, setBank] = useState<BankType>('ING_NL')
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
    formData.append('bank', bank)

    try {
      // Detect file type by extension
      const fileName = file.name.toLowerCase()
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
      
      const importResult = isXLSX 
        ? await importXLSX(formData)
        : await importCSV(formData)

      if (importResult.success) {
        let message = `✅ Successfully imported ${importResult.count} new transaction${importResult.count === 1 ? '' : 's'}!`
        
        if (importResult.duplicates && importResult.duplicates > 0) {
          message += ` (${importResult.duplicates} duplicate${importResult.duplicates === 1 ? '' : 's'} skipped)`
        }
        
        setResult({
          type: 'success',
          message,
        })
        setFile(null)
        // Reset file input
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
      } else {
        setResult({
          type: 'error',
          message: `❌ Error: ${importResult.error}`,
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bank Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Your Bank
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setBank('ING_NL')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              bank === 'ING_NL'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-white">ING Netherlands</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CSV or XLSX format</div>
          </button>

          <button
            type="button"
            onClick={() => setBank('ING_ES')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              bank === 'ING_ES'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-white">ING Spain</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CSV or XLSX format</div>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label
          htmlFor="file-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Upload File
        </label>
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
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Result Message */}
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isUploading ? 'Importing...' : 'Import Transactions'}
      </button>
    </form>
  )
}

