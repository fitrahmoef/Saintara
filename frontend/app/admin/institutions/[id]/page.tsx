'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { institutionAPI } from '@/lib/api'
import {
  HiArrowLeft,
  HiOfficeBuilding,
  HiUsers,
  HiCheck,
  HiCash,
  HiTrendingUp,
  HiPencil,
  HiUserGroup,
  HiChartBar,
} from 'react-icons/hi'

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

interface Statistics {
  total_customers: number
  active_customers: number
  total_tests: number
  completed_tests: number
  total_revenue: number
  active_admins: number
}

interface Analytics {
  customer_growth: Array<{ month: string; count: number }>
  test_distribution: Array<{ type: string; count: number }>
  revenue_by_month: Array<{ month: string; revenue: number }>
}

interface Admin {
  id: number
  name: string
  email: string
  role: string
  assigned_at: string
}

export default function InstitutionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const institutionId = parseInt(params.id as string)

  const [institution, setInstitution] = useState<Institution | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    max_users: 0,
    subscription_type: '',
    is_active: true,
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role || '')
    fetchInstitutionData()
  }, [institutionId])

  const fetchInstitutionData = async () => {
    setLoading(true)
    try {
      // Fetch institution details
      const instResponse = await institutionAPI.getById(institutionId)
      if (instResponse.data.status === 'success') {
        const data = instResponse.data.data
        setInstitution(data)
        setFormData({
          name: data.name,
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          max_users: data.max_users,
          subscription_type: data.subscription_type,
          is_active: data.is_active,
        })
      }

      // Fetch statistics
      try {
        const statsResponse = await institutionAPI.getStatistics(institutionId)
        if (statsResponse.data.status === 'success') {
          setStatistics(statsResponse.data.data)
        }
      } catch (error) {
        console.log('Statistics not available')
      }

      // Fetch analytics
      try {
        const analyticsResponse = await institutionAPI.getAnalytics(institutionId)
        if (analyticsResponse.data.status === 'success') {
          setAnalytics(analyticsResponse.data.data)
        }
      } catch (error) {
        console.log('Analytics not available')
      }

      // Fetch admins
      try {
        const adminsResponse = await institutionAPI.getAdmins(institutionId)
        if (adminsResponse.data.status === 'success') {
          setAdmins(adminsResponse.data.data)
        }
      } catch (error) {
        console.log('Admins not available')
      }
    } catch (error: any) {
      console.error('Error fetching institution:', error)
      alert(error.response?.data?.message || 'Gagal memuat data institusi')
      router.push('/admin/institutions')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await institutionAPI.update(institutionId, formData)
      if (response.data.status === 'success') {
        alert('Institusi berhasil diupdate!')
        setEditMode(false)
        fetchInstitutionData()
      }
    } catch (error: any) {
      console.error('Error updating institution:', error)
      alert(error.response?.data?.message || 'Gagal mengupdate institusi')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data institusi...</p>
        </div>
      </div>
    )
  }

  if (!institution) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/institutions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <HiArrowLeft className="text-xl" />
            Kembali ke Daftar Institusi
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-saintara-yellow rounded-lg flex items-center justify-center">
                <HiOfficeBuilding className="text-3xl text-saintara-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-mono rounded">
                    {institution.code}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(
                      institution.subscription_type
                    )}`}
                  >
                    {institution.subscription_type}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      institution.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {institution.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/admin/institutions/${institutionId}/admins`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <HiUserGroup className="text-xl" />
                Kelola Admin
              </button>
              {(userRole === 'superadmin' || userRole === 'admin') && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  <HiPencil className="text-xl" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.total_customers}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {statistics.active_customers} aktif
                  </p>
                </div>
                <HiUsers className="text-4xl text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Tests</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.total_tests}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {statistics.completed_tests} selesai
                  </p>
                </div>
                <HiCheck className="text-4xl text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(statistics.total_revenue)}
                  </p>
                </div>
                <HiCash className="text-4xl text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Admins</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.active_admins}</p>
                </div>
                <HiUserGroup className="text-4xl text-purple-500" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Institution Details / Edit Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Detail Institusi</h2>
                {editMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setFormData({
                          name: institution.name,
                          contact_email: institution.contact_email || '',
                          contact_phone: institution.contact_phone || '',
                          address: institution.address || '',
                          max_users: institution.max_users,
                          subscription_type: institution.subscription_type,
                          is_active: institution.is_active,
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Institusi
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Kontak
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipe Subscription
                    </label>
                    <select
                      value={formData.subscription_type}
                      onChange={(e) =>
                        setFormData({ ...formData, subscription_type: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maksimal User
                    </label>
                    <input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) =>
                        setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4 text-saintara-yellow focus:ring-saintara-yellow border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Institusi Aktif
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{institution.contact_email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon:</span>
                    <span className="font-medium">{institution.contact_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alamat:</span>
                    <span className="font-medium text-right">{institution.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maksimal User:</span>
                    <span className="font-medium">{institution.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Customer:</span>
                    <span className="font-medium">{institution.customer_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="font-medium">{formatDate(institution.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terakhir Update:</span>
                    <span className="font-medium">{formatDate(institution.updated_at)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiChartBar className="text-2xl text-saintara-yellow" />
                  <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
                </div>
                <div className="space-y-6">
                  {/* Customer Growth */}
                  {analytics.customer_growth && analytics.customer_growth.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Customer Growth</h3>
                      <div className="space-y-2">
                        {analytics.customer_growth.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 w-24">{item.month}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-saintara-yellow h-4 rounded-full"
                                style={{
                                  width: `${
                                    (item.count /
                                      Math.max(
                                        ...analytics.customer_growth.map((i) => i.count)
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Distribution */}
                  {analytics.test_distribution && analytics.test_distribution.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Test Distribution</h3>
                      <div className="space-y-2">
                        {analytics.test_distribution.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{item.type}</span>
                            <span className="text-sm font-medium text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admins List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Admin</h2>
                <button
                  onClick={() => router.push(`/admin/institutions/${institutionId}/admins`)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Kelola →
                </button>
              </div>
              {admins.length === 0 ? (
                <p className="text-gray-500 text-sm">Belum ada admin yang di-assign</p>
              ) : (
                <div className="space-y-3">
                  {admins.slice(0, 5).map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                        <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {admin.role}
                      </span>
                    </div>
                  ))}
                  {admins.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{admins.length - 5} admin lainnya
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/admin/customers?institution_id=${institutionId}`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  Lihat Customers
                </button>
                <button
                  onClick={() => router.push(`/admin/institutions/${institutionId}/admins`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  Kelola Admin
                </button>
                <button
                  onClick={() =>
                    router.push(`/admin/customers/import?institution_id=${institutionId}`)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  Bulk Import Customers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
