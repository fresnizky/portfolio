import { useState } from 'react'
import { api } from '@/lib/api'

type ExportFormat = 'json' | 'csv'
type ExportStatus = 'idle' | 'loading' | 'success' | 'error'

export function ExportSection() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      if (format === 'json') {
        const data = await api.settings.exportJson()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        downloadBlob(blob, `portfolio-backup-${getDateString()}.json`)
      } else {
        const blob = await api.settings.exportCsv()
        downloadBlob(blob, `portfolio-backup-${getDateString()}.zip`)
      }
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error al exportar')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDateString = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Exportar datos</h3>
        <p className="text-sm text-gray-500 mb-4">
          Descarga todos tus datos en formato JSON o CSV para respaldo
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport('json')}
          disabled={status === 'loading'}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          {status === 'loading' ? 'Exportando...' : 'Exportar JSON'}
        </button>

        <button
          onClick={() => handleExport('csv')}
          disabled={status === 'loading'}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          {status === 'loading' ? 'Exportando...' : 'Exportar CSV (ZIP)'}
        </button>
      </div>

      {status === 'success' && (
        <p className="text-sm text-green-600">Archivo descargado correctamente</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
