'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { customerAPI } from '@/lib/api'
import {
  HiArrowLeft,
  HiUpload,
  HiDownload,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiDocumentText,
} from 'react-icons/hi'

interface ImportResult {
  status: string
  message: string
  data?: {
    total_rows: number
    successful: number
    failed: number
    errors: Array<{
      row: number
      email?: string
      errors: string[]
    }>
  }
}

export default function BulkImportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const institutionIdParam = searchParams.get('institution_id')

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userInstitutionId, setUserInstitutionId] = useState<number | undefined>()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role || '')
    setUserInstitutionId(user.institution_id)
  }, [])

  const handleDownloadTemplate = async () => {
    try {
      const response = await customerAPI.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'customer_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      alert('Gagal mengunduh template')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ]
      if (!validTypes.includes(selectedFile.type)) {
        alert('File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)')
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }

      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Pilih file terlebih dahulu')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Add institution_id if available
      const institutionId = institutionIdParam || userInstitutionId
      if (institutionId) {
        formData.append('institution_id', institutionId.toString())
      }

      const response = await customerAPI.bulkImport(formData)

      if (response.data.status === 'success' || response.data.status === 'partial') {
        setImportResult(response.data)
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      const errorMessage = error.response?.data?.message || 'Gagal mengupload file'
      const errorData = error.response?.data?.data

      setImportResult({
        status: 'error',
        message: errorMessage,
        data: errorData,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
  }

  const downloadErrorReport = () => {
    if (!importResult?.data?.errors || importResult.data.errors.length === 0) return

    const csvContent = [
      ['Row', 'Email', 'Errors'],
      ...importResult.data.errors.map((error) => [
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
    link.setAttribute('download', 'import_errors.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <HiArrowLeft className="text-xl" />
            Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HiUpload className="text-saintara-yellow" />
            Bulk Import Customer
          </h1>
          <p className="text-gray-600 mt-1">Import banyak customer sekaligus menggunakan Excel/CSV</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Cara Import Customer:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Download template Excel dengan klik tombol "Download Template"</li>
            <li>Isi data customer sesuai dengan format yang ada di template</li>
            <li>Pastikan email customer unik dan valid</li>
            <li>Upload file Excel/CSV yang sudah diisi</li>
            <li>Tunggu proses import selesai dan lihat hasilnya</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Catatan:</strong> File maksimal 5MB. Format yang didukung: .xlsx, .xls, .csv
            </p>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Template Import</h2>
              <p className="text-gray-600 text-sm">
                Download template Excel untuk format yang benar
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <HiDownload className="text-xl" />
              Download Template
            </button>
          </div>
        </div>

        {/* Upload Area */}
        {!importResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload File</h2>

            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <HiDocumentText className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Pilih file Excel atau CSV untuk diupload
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="cursor-pointer bg-saintara-yellow text-saintara-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors inline-block">
                    Pilih File
                  </span>
                </label>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HiDocumentText className="text-3xl text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-saintara-yellow text-saintara-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-saintara-black"></div>
                      Mengupload...
                    </span>
                  ) : (
                    'Upload & Import'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              {importResult.status === 'success' && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <HiCheckCircle className="text-3xl text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Import Berhasil!</h3>
                    <p className="text-sm text-green-800">{importResult.message}</p>
                  </div>
                </div>
              )}

              {importResult.status === 'partial' && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <HiExclamationCircle className="text-3xl text-yellow-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900">Import Sebagian Berhasil</h3>
                    <p className="text-sm text-yellow-800">{importResult.message}</p>
                  </div>
                </div>
              )}

              {importResult.status === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <HiXCircle className="text-3xl text-red-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">Import Gagal</h3>
                    <p className="text-sm text-red-800">{importResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics */}
            {importResult.data && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 mb-1">Total Baris</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {importResult.data.total_rows}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 mb-1">Berhasil</p>
                  <p className="text-3xl font-bold text-green-900">
                    {importResult.data.successful}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 mb-1">Gagal</p>
                  <p className="text-3xl font-bold text-red-900">{importResult.data.failed}</p>
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.data?.errors && importResult.data.errors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Detail Error</h3>
                  <button
                    onClick={downloadErrorReport}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <HiDownload />
                    Download Error Report
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
                      {importResult.data.errors.map((error, index) => (
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

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Import Lagi
              </button>
              <button
                onClick={() => router.push('/admin/customers')}
                className="flex-1 px-6 py-3 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Lihat Daftar Customer
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Format Data</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">Email:</span> Wajib diisi, harus unik dan valid
            </div>
            <div>
              <span className="font-medium text-gray-900">Name:</span> Wajib diisi, nama lengkap customer
            </div>
            <div>
              <span className="font-medium text-gray-900">Password:</span> Wajib diisi, minimal 6 karakter
            </div>
            <div>
              <span className="font-medium text-gray-900">Phone:</span> Opsional, nomor telepon
            </div>
            <div>
              <span className="font-medium text-gray-900">Gender:</span> Opsional, male/female
            </div>
            <div>
              <span className="font-medium text-gray-900">Blood Type:</span> Opsional, A/B/AB/O
            </div>
            <div>
              <span className="font-medium text-gray-900">Country:</span> Opsional, nama negara
            </div>
            <div>
              <span className="font-medium text-gray-900">City:</span> Opsional, nama kota
            </div>
            <div>
              <span className="font-medium text-gray-900">Nickname:</span> Opsional, nama panggilan
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
