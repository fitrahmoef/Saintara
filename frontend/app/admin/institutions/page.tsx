'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { institutionAPI } from '@/lib/api'
import { HiPlus, HiPencil, HiTrash, HiEye, HiSearch, HiUsers, HiOfficeBuilding } from 'react-icons/hi'

interface Institution {
  id: number
  name: string
  code: string
  contact_email?: string
  contact_phone?: string
  address?: string
  max_users: number
  is_active: boolean
  subscription_type: string
  subscription_expires_at?: string
  customer_count?: number
  admin_count?: number
  created_at: string
  updated_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function InstitutionsPage() {
  const router = useRouter()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  })
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role || '')
    fetchInstitutions()
  }, [pagination.page, search, filterActive])

  const fetchInstitutions = async () => {
    setLoading(true)
    try {
      const response = await institutionAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        is_active: filterActive,
      })

      if (response.data.status === 'success') {
        setInstitutions(response.data.data.items)
        setPagination(response.data.data.pagination)
      }
    } catch (error: any) {
      console.error('Error fetching institutions:', error)
      alert(error.response?.data?.message || 'Gagal memuat data institusi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!institutionToDelete) return

    try {
      await institutionAPI.delete(institutionToDelete.id)
      alert('Institusi berhasil dihapus')
      setShowDeleteModal(false)
      setInstitutionToDelete(null)
      fetchInstitutions()
    } catch (error: any) {
      console.error('Error deleting institution:', error)
      alert(error.response?.data?.message || 'Gagal menghapus institusi')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
  }

  const getSubscriptionBadgeColor = (type: string) => {
    switch (type) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800'
      case 'premium':
        return 'bg-blue-100 text-blue-800'
      case 'basic':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HiOfficeBuilding className="text-saintara-yellow" />
              Manajemen Institusi
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola institusi dan akses admin
            </p>
          </div>
          {userRole === 'superadmin' && (
            <button
              onClick={() => router.push('/admin/institutions/new')}
              className="flex items-center gap-2 bg-saintara-yellow text-saintara-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <HiPlus className="text-xl" />
              Tambah Institusi
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Institusi</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <HiOfficeBuilding className="text-4xl text-saintara-yellow" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Institusi Aktif</p>
                <p className="text-3xl font-bold text-green-600">
                  {institutions.filter(i => i.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customer</p>
                <p className="text-3xl font-bold text-blue-600">
                  {institutions.reduce((sum, i) => sum + (i.customer_count || 0), 0)}
                </p>
              </div>
              <HiUsers className="text-4xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama atau kode institusi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
              />
            </div>
            <select
              value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value
                setFilterActive(value === '' ? undefined : value === 'true')
                setPagination({ ...pagination, page: 1 })
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-12">
              <HiOfficeBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data institusi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institusi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admins
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {institutions.map((institution) => (
                      <tr key={institution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-saintara-yellow rounded-lg flex items-center justify-center">
                              <HiOfficeBuilding className="text-saintara-black text-xl" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {institution.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {institution.contact_email || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
                            {institution.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(
                              institution.subscription_type
                            )}`}
                          >
                            {institution.subscription_type}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {institution.max_users} users
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <HiUsers className="text-blue-500" />
                            <span className="text-sm text-gray-900">
                              {institution.customer_count || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {institution.admin_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              institution.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {institution.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/institutions/${institution.id}`)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                              title="Lihat Detail"
                            >
                              <HiEye className="text-lg" />
                            </button>
                            {(userRole === 'superadmin' || userRole === 'admin') && (
                              <button
                                onClick={() => router.push(`/admin/institutions/${institution.id}`)}
                                className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded transition-colors"
                                title="Edit"
                              >
                                <HiPencil className="text-lg" />
                              </button>
                            )}
                            {userRole === 'superadmin' && (
                              <button
                                onClick={() => {
                                  setInstitutionToDelete(institution)
                                  setShowDeleteModal(true)
                                }}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                title="Hapus"
                              >
                                <HiTrash className="text-lg" />
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
                    dari <span className="font-medium">{pagination.total}</span> institusi
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination({ ...pagination, page })}
                        className={`px-4 py-2 border rounded-lg ${
                          page === pagination.page
                            ? 'bg-saintara-yellow text-saintara-black border-saintara-yellow'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
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

      {/* Delete Modal */}
      {showDeleteModal && institutionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus institusi{' '}
              <span className="font-semibold">{institutionToDelete.name}</span>?
              <br />
              <br />
              Tindakan ini akan menonaktifkan institusi dan tidak dapat dibatalkan.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setInstitutionToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
