'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { institutionAPI, adminAPI } from '@/lib/api'
import {
  HiArrowLeft,
  HiUserGroup,
  HiTrash,
  HiPlus,
  HiSearch,
  HiOfficeBuilding,
} from 'react-icons/hi'

interface Institution {
  id: number
  name: string
  code: string
}

interface Admin {
  id: number
  user_id: number
  name: string
  email: string
  role: string
  assigned_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function ManageInstitutionAdminsPage() {
  const router = useRouter()
  const params = useParams()
  const institutionId = parseInt(params.id as string)

  const [institution, setInstitution] = useState<Institution | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)
  const [searchUsers, setSearchUsers] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('institution_admin')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [institutionId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch institution details
      const instResponse = await institutionAPI.getById(institutionId)
      if (instResponse.data.status === 'success') {
        setInstitution(instResponse.data.data)
      }

      // Fetch current admins
      const adminsResponse = await institutionAPI.getAdmins(institutionId)
      if (adminsResponse.data.status === 'success') {
        setAdmins(adminsResponse.data.data)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      alert(error.response?.data?.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const searchAvailableUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers(1, 20, searchUsers)
      if (response.data.status === 'success') {
        // Filter out users who are already admins
        const currentAdminIds = admins.map((admin) => admin.user_id)
        const filtered = response.data.data.items.filter(
          (user: User) => !currentAdminIds.includes(user.id)
        )
        setAvailableUsers(filtered)
      }
    } catch (error: any) {
      console.error('Error searching users:', error)
    }
  }

  useEffect(() => {
    if (showAddModal && searchUsers.length > 0) {
      const timeoutId = setTimeout(() => {
        searchAvailableUsers()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setAvailableUsers([])
    }
  }, [searchUsers, showAddModal])

  const handleAssignAdmin = async () => {
    if (!selectedUser) {
      alert('Pilih user terlebih dahulu')
      return
    }

    setAssigning(true)
    try {
      await institutionAPI.assignAdmin(institutionId, selectedUser.id, selectedRole)
      alert('Admin berhasil di-assign!')
      setShowAddModal(false)
      setSelectedUser(null)
      setSearchUsers('')
      setAvailableUsers([])
      fetchData()
    } catch (error: any) {
      console.error('Error assigning admin:', error)
      alert(error.response?.data?.message || 'Gagal assign admin')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveAdmin = async () => {
    if (!adminToDelete) return

    try {
      await institutionAPI.removeAdmin(institutionId, adminToDelete.id)
      alert('Admin berhasil dihapus!')
      setShowDeleteModal(false)
      setAdminToDelete(null)
      fetchData()
    } catch (error: any) {
      console.error('Error removing admin:', error)
      alert(error.response?.data?.message || 'Gagal menghapus admin')
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'institution_admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saintara-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/institutions/${institutionId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <HiArrowLeft className="text-xl" />
            Kembali ke Detail Institusi
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <HiUserGroup className="text-saintara-yellow" />
                Kelola Admin Institusi
              </h1>
              {institution && (
                <div className="flex items-center gap-2 mt-2">
                  <HiOfficeBuilding className="text-gray-500" />
                  <span className="text-gray-600">{institution.name}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
                    {institution.code}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-saintara-yellow text-saintara-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <HiPlus className="text-xl" />
              Assign Admin
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Admin</p>
              <p className="text-3xl font-bold text-gray-900">{admins.length}</p>
            </div>
            <HiUserGroup className="text-5xl text-saintara-yellow" />
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Daftar Admin</h2>
          </div>
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <HiUserGroup className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada admin yang di-assign</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Assign admin pertama →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Di-assign pada: {formatDate(admin.assigned_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                          admin.role
                        )}`}
                      >
                        {admin.role}
                      </span>
                      <button
                        onClick={() => {
                          setAdminToDelete(admin)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Admin"
                      >
                        <HiTrash className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Admin ke Institusi</h3>

            <div className="space-y-4">
              {/* Search User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari User <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    placeholder="Ketik nama atau email user..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  />
                </div>
              </div>

              {/* Available Users */}
              {availableUsers.length > 0 && (
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">User Terpilih:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                >
                  <option value="institution_admin">Institution Admin</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Institution Admin: Akses penuh ke institusi ini
                  <br />
                  Admin: Akses standar ke institusi ini
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedUser(null)
                  setSearchUsers('')
                  setAvailableUsers([])
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={assigning}
              >
                Batal
              </button>
              <button
                onClick={handleAssignAdmin}
                disabled={!selectedUser || assigning}
                className="flex-1 px-4 py-2 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Menyimpan...' : 'Assign Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && adminToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus{' '}
              <span className="font-semibold">{adminToDelete.name}</span> dari institusi ini?
              <br />
              <br />
              User ini akan kehilangan akses ke institusi, tapi akun user tidak akan dihapus.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setAdminToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleRemoveAdmin}
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
