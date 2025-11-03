'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authAPI } from '@/lib/api'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone: '',
    gender: '',
    blood_type: '',
    country: '',
    city: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        nickname: user.nickname || '',
        phone: user.phone || '',
        gender: user.gender || '',
        blood_type: user.blood_type || '',
        country: user.country || '',
        city: user.city || '',
        avatar_url: user.avatar_url || ''
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.updateProfile(formData)
      setUser(response.data.data.user)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <div className="flex items-center mb-6">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-4xl text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                disabled={!editing}
                placeholder="Nama panggilan Anda"
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                placeholder="+62812345678"
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Golongan Darah
                </label>
                <select
                  value={formData.blood_type}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                >
                  <option value="">Pilih golongan darah</option>
                  <option value="A">A</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B">B</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB">AB</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O">O</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negara
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!editing}
                  placeholder="Indonesia"
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!editing}
                  placeholder="Jakarta"
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <input
                type="text"
                value={new Date(user?.created_at || '').toLocaleDateString()}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      name: user?.name || '',
                      nickname: user?.nickname || '',
                      phone: user?.phone || '',
                      gender: user?.gender || '',
                      blood_type: user?.blood_type || '',
                      country: user?.country || '',
                      city: user?.city || '',
                      avatar_url: user?.avatar_url || ''
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
