'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { institutionAPI } from '@/lib/api'
import { HiArrowLeft, HiOfficeBuilding } from 'react-icons/hi'

interface FormData {
  name: string
  code: string
  contact_email: string
  contact_phone: string
  address: string
  max_users: number
  subscription_type: string
}

interface FormErrors {
  name?: string
  code?: string
  contact_email?: string
  max_users?: string
  subscription_type?: string
}

export default function NewInstitutionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    max_users: 100,
    subscription_type: 'basic',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    // Check if user is superadmin
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'superadmin') {
      alert('Akses ditolak. Hanya superadmin yang dapat menambah institusi.')
      router.push('/admin/institutions')
    }
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama institusi wajib diisi'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Kode institusi wajib diisi'
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Kode hanya boleh berisi huruf kapital, angka, underscore, dan dash'
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Email kontak wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Format email tidak valid'
    }

    if (formData.max_users < 1) {
      newErrors.max_users = 'Maksimal user harus minimal 1'
    }

    if (!formData.subscription_type) {
      newErrors.subscription_type = 'Tipe subscription wajib dipilih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await institutionAPI.create(formData)

      if (response.data.status === 'success') {
        alert('Institusi berhasil dibuat!')
        router.push('/admin/institutions')
      }
    } catch (error: any) {
      console.error('Error creating institution:', error)
      alert(error.response?.data?.message || 'Gagal membuat institusi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_users' ? parseInt(value) || 0 : value,
    }))
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
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
            <HiOfficeBuilding className="text-saintara-yellow" />
            Tambah Institusi Baru
          </h1>
          <p className="text-gray-600 mt-1">
            Buat institusi baru dan konfigurasikan pengaturan awal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Institusi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="PT. Contoh Indonesia"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Institusi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent font-mono ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="PT_CONTOH"
                  style={{ textTransform: 'uppercase' }}
                />
                <p className="text-gray-500 text-xs mt-1">
                  Gunakan huruf kapital, angka, underscore (_), dan dash (-)
                </p>
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Kontak <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent ${
                    errors.contact_email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="kontak@contoh.com"
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  placeholder="+62 21 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>
            </div>
          </div>

          {/* Subscription Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Subscription</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Subscription <span className="text-red-500">*</span>
                </label>
                <select
                  name="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent ${
                    errors.subscription_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                {errors.subscription_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.subscription_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimal User <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-saintara-yellow focus:border-transparent ${
                    errors.max_users ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="text-gray-500 text-xs mt-1">
                  Jumlah maksimal user yang dapat dibuat dalam institusi ini
                </p>
                {errors.max_users && (
                  <p className="text-red-500 text-sm mt-1">{errors.max_users}</p>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Type Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Informasi Tipe Subscription:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                <strong>Basic:</strong> Fitur standar, cocok untuk institusi kecil
              </li>
              <li>
                <strong>Premium:</strong> Fitur tambahan dan dukungan prioritas
              </li>
              <li>
                <strong>Enterprise:</strong> Semua fitur dan dukungan dedicated
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-saintara-yellow text-saintara-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Menyimpan...' : 'Buat Institusi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
