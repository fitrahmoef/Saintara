'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { customerAPI } from '@/lib/api'
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiClock,
  HiDownload,
} from 'react-icons/hi'

interface ImportHistory {
  id: number
  filename: string
  uploaded_by: number
  uploaded_by_name: string
  institution_id?: number
  institution_name?: string
  total_rows: number
  successful_rows: number
  failed_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  error_message?: string
  error_details?: Array<{
    row: number
    email?: string
    errors: string[]
  }>
  created_at: string
  updated_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function ImportHistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  })
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [pagination.page])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.getImportHistory({
        page: pagination.page,
        limit: pagination.limit,
      })

      if (response.data.status === 'success') {
        setHistory(response.data.data.items)
        setPagination(response.data.data.pagination)
      }
    } catch (error: any) {
      console.error('Error fetching import history:', error)
      alert(error.response?.data?.message || 'Gagal memuat history import')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <HiCheckCircle />
            Berhasil
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <HiXCircle />
            Gagal
          </span>
        )
      case 'partial':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <HiExclamationCircle />
            Sebagian
          </span>
        )
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <HiClock />
            Proses
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <HiClock />
            Pending
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const downloadErrorReport = (importData: ImportHistory) => {
    if (!importData.error_details || importData.error_details.length === 0) return

    const csvContent = [
      ['Row', 'Email', 'Errors'],
      ...importData.error_details.map((error) => [
        error.row,
        error.email || '-',
        error.errors.join('; '),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `import_errors_${importData.id}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const getSuccessRate = (item: ImportHistory) => {
    if (item.total_rows === 0) return 0
    return Math.round((item.successful_rows / item.total_rows) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <HiArrowLeft className="text-xl" />
            Kembali ke Customer Management
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <HiClock className="text-saintara-yellow" />
                History Import Customer
              </h1>
              <p className="text-gray-600 mt-1">
                Lihat riwayat import customer dan detailnya
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/customers/import')}
              className="px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Import Baru
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Import</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <HiClock className="text-4xl text-saintara-yellow" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Berhasil</p>
                <p className="text-3xl font-bold text-green-600">
                  {history.filter((h) => h.status === 'completed').length}
                </p>
              </div>
              <HiCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Sebagian</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {history.filter((h) => h.status === 'partial').length}
                </p>
              </div>
              <HiExclamationCircle className="text-4xl text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Gagal</p>
                <p className="text-3xl font-bold text-red-600">
                  {history.filter((h) => h.status === 'failed').length}
                </p>
              </div>
              <HiXCircle className="text-4xl text-red-500" />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat history...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <HiClock className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada history import</p>
              <button
                onClick={() => router.push('/admin/customers/import')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Import customer sekarang →
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institusi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Rows
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.filename}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.institution_name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.uploaded_by_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.total_rows}</div>
                          <div className="text-xs text-gray-500">
                            {item.successful_rows} sukses, {item.failed_rows} gagal
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  getSuccessRate(item) === 100
                                    ? 'bg-green-500'
                                    : getSuccessRate(item) >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${getSuccessRate(item)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {getSuccessRate(item)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatDate(item.created_at)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedImport(item)
                                setShowDetailModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Detail
                            </button>
                            {item.error_details && item.error_details.length > 0 && (
                              <button
                                onClick={() => downloadErrorReport(item)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                title="Download Error Report"
                              >
                                <HiDownload />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    dari <span className="font-medium">{pagination.total}</span> history
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.total_pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detail Import</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedImport(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Import Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Filename</p>
                  <p className="font-medium text-gray-900">{selectedImport.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedImport.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Institusi</p>
                  <p className="font-medium text-gray-900">
                    {selectedImport.institution_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upload By</p>
                  <p className="font-medium text-gray-900">{selectedImport.uploaded_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="font-medium text-gray-900">{selectedImport.total_rows}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedImport.created_at)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 mb-1">Berhasil</p>
                  <p className="text-2xl font-bold text-green-900">
                    {selectedImport.successful_rows}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 mb-1">Gagal</p>
                  <p className="text-2xl font-bold text-red-900">{selectedImport.failed_rows}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {getSuccessRate(selectedImport)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {selectedImport.error_details && selectedImport.error_details.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Detail Error</h4>
                  <button
                    onClick={() => downloadErrorReport(selectedImport)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <HiDownload />
                    Download Report
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Baris
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedImport.error_details.map((error, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{error.row}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{error.email || '-'}</td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {error.errors.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Message */}
            {selectedImport.error_message && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-1">Error Message:</p>
                <p className="text-sm text-red-800">{selectedImport.error_message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
