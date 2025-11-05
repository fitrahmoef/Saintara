'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { customerAPI } from '@/lib/api'
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiSearch,
  HiUsers,
  HiUpload,
  HiDownload,
  HiFilter,
} from 'react-icons/hi'

interface Customer {
  id: number
  email: string
  name: string
  phone?: string
  gender?: string
  blood_type?: string
  country?: string
  city?: string
  nickname?: string
  institution_id?: number
  institution_name?: string
  is_active: boolean
  test_count?: number
  tag_ids?: number[]
  tag_names?: string[]
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const institutionIdParam = searchParams.get('institution_id')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  })
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterInstitution, setFilterInstitution] = useState<number | undefined>(
    institutionIdParam ? parseInt(institutionIdParam) : undefined
  )
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userInstitutionId, setUserInstitutionId] = useState<number | undefined>()

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    gender: '',
    blood_type: '',
    country: '',
    city: '',
    nickname: '',
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role || '')
    setUserInstitutionId(user.institution_id)

    // If institution_admin, filter by their institution
    if (user.role === 'institution_admin' && user.institution_id) {
      setFilterInstitution(user.institution_id)
    }

    fetchCustomers()
  }, [pagination.page, search, filterStatus, filterInstitution, sortBy, sortOrder])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: filterStatus || undefined,
        institution_id: filterInstitution,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (response.data.status === 'success') {
        setCustomers(response.data.data.items)
        setPagination(response.data.data.pagination)
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      alert(error.response?.data?.message || 'Gagal memuat data customer')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSubmit = {
        ...formData,
        institution_id: userInstitutionId || filterInstitution,
      }
      await customerAPI.create(dataToSubmit)
      alert('Customer berhasil dibuat!')
      setShowCreateModal(false)
      resetForm()
      fetchCustomers()
    } catch (error: any) {
      console.error('Error creating customer:', error)
      alert(error.response?.data?.message || 'Gagal membuat customer')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      await customerAPI.update(selectedCustomer.id, formData)
      alert('Customer berhasil diupdate!')
      setShowEditModal(false)
      setSelectedCustomer(null)
      resetForm()
      fetchCustomers()
    } catch (error: any) {
      console.error('Error updating customer:', error)
      alert(error.response?.data?.message || 'Gagal mengupdate customer')
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return

    try {
      await customerAPI.delete(selectedCustomer.id)
      alert('Customer berhasil dihapus!')
      setShowDeleteModal(false)
      setSelectedCustomer(null)
      fetchCustomers()
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      alert(error.response?.data?.message || 'Gagal menghapus customer')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      phone: '',
      gender: '',
      blood_type: '',
      country: '',
      city: '',
      nickname: '',
    })
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      email: customer.email,
      name: customer.name,
      password: '',
      phone: customer.phone || '',
      gender: customer.gender || '',
      blood_type: customer.blood_type || '',
      country: customer.country || '',
      city: customer.city || '',
      nickname: customer.nickname || '',
    })
    setShowEditModal(true)
  }

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
    } catch (error: any) {
      console.error('Error downloading template:', error)
      alert('Gagal mengunduh template')
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
              <HiUsers className="text-saintara-yellow" />
              Manajemen Customer
            </h1>
            <p className="text-gray-600 mt-1">Kelola customer dan data mereka</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <HiDownload className="text-xl" />
              Template
            </button>
            <button
              onClick={() => router.push('/admin/customers/import')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HiUpload className="text-xl" />
              Bulk Import
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-saintara-yellow text-saintara-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <HiPlus className="text-xl" />
              Tambah Customer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customer</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <HiUsers className="text-4xl text-saintara-yellow" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aktif</p>
                <p className="text-3xl font-bold text-green-600">
                  {customers.filter((c) => c.is_active).length}
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
                <p className="text-gray-600 text-sm">Tidak Aktif</p>
                <p className="text-3xl font-bold text-red-600">
                  {customers.filter((c) => !c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-500"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Tests</p>
                <p className="text-3xl font-bold text-blue-600">
                  {customers.reduce((sum, c) => sum + (c.test_count || 0), 0)}
                </p>
              </div>
              <HiEye className="text-4xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPagination({ ...pagination, page: 1 })
            }}
            className="space-y-4"
          >
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama atau email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Cari
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <HiFilter className="text-gray-500 text-xl" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
              >
                <option value="created_at">Terbaru</option>
                <option value="name">Nama</option>
                <option value="email">Email</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin/customers/import-history')}
                className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
              >
                Lihat History Import →
              </button>
            </div>
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
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <HiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data customer</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institusi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests
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
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                            {customer.nickname && (
                              <div className="text-xs text-gray-400">@{customer.nickname}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {customer.institution_name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {customer.phone || '-'}
                            {customer.gender && (
                              <span className="ml-2 text-gray-500">({customer.gender})</span>
                            )}
                          </div>
                          {customer.city && (
                            <div className="text-xs text-gray-500">{customer.city}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">
                            {customer.test_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              customer.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(customer)}
                              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded transition-colors"
                              title="Edit"
                            >
                              <HiPencil className="text-lg" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowDeleteModal(true)
                              }}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Hapus"
                            >
                              <HiTrash className="text-lg" />
                            </button>
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
                    dari <span className="font-medium">{pagination.total}</span> customer
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tambah Customer Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  >
                    <option value="">Pilih Gender</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  >
                    <option value="">Pilih Golongan Darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Negara</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500"
                >
                  Tambah Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Customer</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  >
                    <option value="">Pilih Gender</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  >
                    <option value="">Pilih Golongan Darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Negara</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCustomer(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus customer{' '}
              <span className="font-semibold">{selectedCustomer.name}</span>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedCustomer(null)
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
