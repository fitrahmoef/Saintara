'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { HiMenu, HiLogout, HiSearch, HiBell, HiChartBar, HiUsers, HiCalendar, HiCash, HiUserGroup, HiQuestionMarkCircle, HiCog } from 'react-icons/hi'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const stats = [
    { title: 'Total Tes Bulan Ini', value: '500', icon: HiChartBar, color: 'bg-yellow-100 text-saintara-yellow' },
    { title: 'Agen Aktif', value: '321', icon: HiUsers, color: 'bg-yellow-100 text-saintara-yellow' },
    { title: 'Agenda Talkshow', value: '12 Talkshow', icon: HiCalendar, color: 'bg-yellow-100 text-saintara-yellow' },
    { title: 'Agenda Webinar', value: '1 Webinar', icon: HiCalendar, color: 'bg-yellow-100 text-saintara-yellow' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 flex flex-col bg-saintara-black text-white transition-all duration-300 overflow-hidden`}>
        <div className="h-20 flex items-center justify-center border-b border-gray-700">
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-wider cursor-pointer hover:text-saintara-yellow">SAINTARA</h1>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link href="/admin/dashboard" className="flex items-center px-4 py-2.5 text-gray-900 bg-saintara-yellow rounded-lg font-semibold">
            <HiChartBar className="w-6 h-6 mr-3" />
            Dashboard
          </Link>
          <Link href="/admin/agenda" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiCalendar className="w-6 h-6 mr-3" />
            Agenda
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiUsers className="w-6 h-6 mr-3" />
            Pengguna
          </Link>
          <Link href="/admin/keuangan" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiCash className="w-6 h-6 mr-3" />
            Keuangan
          </Link>
          <Link href="/admin/tim" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiUserGroup className="w-6 h-6 mr-3" />
            Tim
          </Link>
          <Link href="/admin/bantuan" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiQuestionMarkCircle className="w-6 h-6 mr-3" />
            Bantuan dan Layanan
          </Link>
          <Link href="/admin/pengaturan" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg">
            <HiCog className="w-6 h-6 mr-3" />
            Pengaturan
          </Link>
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg"
          >
            <HiLogout className="w-6 h-6 mr-3" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-4 md:hidden">
              <HiMenu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, {user?.name || 'Admin'}!</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiSearch className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="search"
                className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-saintara-yellow focus:border-saintara-yellow"
                placeholder="Search..."
              />
            </div>
            <button type="button" className="relative inline-flex items-center p-2 text-sm font-medium text-center text-gray-600 hover:text-gray-900">
              <HiBell className="w-6 h-6" />
            </button>
            <Link href="/admin/profile" className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-saintara-yellow flex items-center justify-center text-white font-bold mr-3">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 uppercase">{user?.role || 'Admin'}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
          <div className="container mx-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.color} rounded-full`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Distribution Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">Distribusi Tes</h3>
                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-saintara-yellow to-yellow-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-700">500</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-saintara-yellow mr-2" />
                      <span>Personal</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-yellow-300 mr-2" />
                      <span>Institution</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-yellow-200 mr-2" />
                      <span>Gift</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approvals */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Permohonan Persetujuan</h3>
                  <Link href="/admin/approvals" className="text-sm text-saintara-yellow hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Komisi Agen</p>
                      <p className="text-sm text-gray-500">Today at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Penawaran Kerja sama</p>
                      <p className="text-sm text-gray-500">Today at 09:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Undangan Seminar</p>
                      <p className="text-sm text-gray-500">Yesterday at 03:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales and Team Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">Penjualan Token Bulan Ini</h3>
                <p className="text-3xl font-bold text-gray-900">Rp9.600.000,-</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-semibold text-green-500 mr-2">+2.40%</span>
                  <span className="text-xs text-gray-500">On track</span>
                </div>
                <div className="mt-4 h-24 flex items-end space-x-2">
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '40%' }} />
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '60%' }} />
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '30%' }} />
                  <div className="w-full bg-saintara-yellow rounded-t-sm" style={{ height: '80%' }} />
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '50%' }} />
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '70%' }} />
                  <div className="w-full bg-yellow-200 rounded-t-sm" style={{ height: '60%' }} />
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Laporan Harian Tim</h3>
                  <Link href="/admin/reports" className="text-sm text-saintara-yellow hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-4" />
                    <div>
                      <p className="font-semibold text-gray-800">Lia Kaula</p>
                      <p className="text-sm text-gray-500">Keuangan</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-4" />
                    <div>
                      <p className="font-semibold text-gray-800">Andi Khindy</p>
                      <p className="text-sm text-gray-500">Marketing</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-4" />
                    <div>
                      <p className="font-semibold text-gray-800">Bayu Subaya</p>
                      <p className="text-sm text-gray-500">Tim IT</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">Absensi</h3>
                <div className="space-y-3">
                  <Link href="/admin/attendance/it" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <HiUserGroup className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">Tim IT</span>
                  </Link>
                  <Link href="/admin/attendance/finance" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <HiCash className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">Tim Keuangan</span>
                  </Link>
                  <Link href="/admin/attendance/marketing" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <div className="p-2 bg-red-100 rounded-full mr-3">
                      <HiChartBar className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-medium text-gray-700">Tim Marketing</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
