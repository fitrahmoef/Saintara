'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { resultAPI } from '@/lib/api'
import { HiBell, HiHome, HiUser, HiClipboardList, HiCreditCard, HiFire, HiNewspaper, HiQuestionMarkCircle, HiCog, HiDownload, HiLogout } from 'react-icons/hi'

interface LatestResult {
  id: number
  character_type_name: string
  character_type_code: string
  description: string
  strengths: string[]
  challenges: string[]
  communication_style: string
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const [latestResult, setLatestResult] = useState<LatestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        const response = await resultAPI.getLatestResult()
        setLatestResult(response.data.data.result)
      } catch (error) {
        console.error('Failed to fetch latest result:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatestResult()
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-saintara-black text-white">
        <div className="h-20 flex items-center justify-center border-b border-gray-700">
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-wider text-white cursor-pointer hover:text-saintara-yellow">SAINTARA</h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-2.5 bg-saintara-yellow text-saintara-black rounded-lg font-semibold">
            <HiHome className="w-6 h-6 mr-3" />
            Beranda
          </Link>
          <Link href="/dashboard/profile" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiUser className="w-6 h-6 mr-3" />
            Profil
          </Link>
          <Link href="/dashboard/tests" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiClipboardList className="w-6 h-6 mr-3" />
            Daftar Tes Karakter
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiCreditCard className="w-6 h-6 mr-3" />
            Transaksi & Token
          </Link>
          <Link href="/dashboard/results" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiFire className="w-6 h-6 mr-3" />
            Hasil Tes
          </Link>
          <Link href="/dashboard/articles" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiNewspaper className="w-6 h-6 mr-3" />
            Artikel Update
          </Link>
          <Link href="/dashboard/bantuan" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
            <HiQuestionMarkCircle className="w-6 h-6 mr-3" />
            Bantuan
          </Link>
          <Link href="/dashboard/settings" className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg">
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
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">Selamat datang, {user?.name || 'User'}!</h2>
          <div className="flex items-center space-x-4">
            <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700">
              <HiBell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-saintara-yellow flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Character Profile Card */}
              {isLoading ? (
                <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 md:mb-0 md:mr-6"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : latestResult ? (
                <div className="p-6 bg-white rounded-lg shadow-md flex flex-col md:flex-row items-center">
                  <div className="text-center md:text-left md:mr-6 flex-shrink-0 mb-4 md:mb-0">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-saintara-yellow to-yellow-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold">{latestResult.character_type_code}</span>
                    </div>
                    <h4 className="text-xs text-gray-500 mt-2">{latestResult.character_type_name.toUpperCase()}</h4>
                    <h3 className="text-xl font-bold text-saintara-black">Karakter Alami Anda</h3>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-gray-200 pl-6 pt-4 md:pt-0">
                    <div className="flex items-center mb-2">
                      <HiFire className="w-6 h-6 text-saintara-yellow mr-2" />
                      <h4 className="font-semibold text-gray-700">Sekilas Tentang Anda</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {latestResult.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-lg shadow-md text-center">
                  <p className="text-gray-600">Belum ada hasil tes. Mulai tes pertama Anda!</p>
                  <Link href="/dashboard/tests" className="mt-4 inline-block px-6 py-2 bg-saintara-yellow text-saintara-black font-semibold rounded-lg hover:bg-yellow-400">
                    Mulai Tes
                  </Link>
                </div>
              )}

              {/* Action Cards */}
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-saintara-black mb-4">Laporan Saintara: Temukan Jati Diri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-yellow-50 rounded-lg flex items-center">
                    <div className="w-16 h-16 mr-4 bg-saintara-yellow rounded-lg flex items-center justify-center">
                      <HiCreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Beli Token & Bayar</h4>
                      <p className="text-sm text-gray-500">Akses tes premium untuk hasil lebih mendalam.</p>
                      <Link href="/dashboard/buy-tokens" className="text-sm font-semibold text-saintara-yellow hover:underline mt-1">
                        Beli Sekarang →
                      </Link>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg flex items-center">
                    <div className="w-16 h-16 mr-4 bg-saintara-black rounded-lg flex items-center justify-center">
                      <HiQuestionMarkCircle className="w-8 h-8 text-saintara-yellow" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Tanyakan Segala Hal</h4>
                      <p className="text-sm text-gray-500">Konsultasi dengan AI Personal Karakter Anda.</p>
                      <Link href="/dashboard/ai-chat" className="text-sm font-semibold text-saintara-yellow hover:underline mt-1">
                        Mulai Bertanya →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Recommendations */}
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-saintara-black mb-4">Rekomendasi Konten</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="/content/stress" className="block p-3 text-center bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="w-12 h-12 mx-auto mb-2 bg-saintara-yellow rounded-full" />
                    <p className="text-sm font-medium text-gray-700">Mengelola Stres</p>
                  </Link>
                  <Link href="/content/career" className="block p-3 text-center bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="w-12 h-12 mx-auto mb-2 bg-saintara-yellow rounded-full" />
                    <p className="text-sm font-medium text-gray-700">Peta Karier Ideal</p>
                  </Link>
                  <Link href="/content/love" className="block p-3 text-center bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="w-12 h-12 mx-auto mb-2 bg-saintara-yellow rounded-full" />
                    <p className="text-sm font-medium text-gray-700">Memahami Bahasa Cinta</p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-8">
              {/* Certificate Download */}
              <div className="p-6 bg-white rounded-lg shadow-md text-center">
                <div className="w-40 h-40 mx-auto mb-4 bg-gradient-to-br from-saintara-yellow to-yellow-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Certificate</span>
                </div>
                <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-saintara-black hover:bg-gray-800 rounded-lg flex items-center justify-center">
                  <HiDownload className="w-5 h-5 mr-2" />
                  Unduh Hasil Tes
                </button>
              </div>

              {/* Strengths & Challenges */}
              {latestResult && (
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Kekuatan</h4>
                    <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                      {latestResult.strengths && latestResult.strengths.length > 0 ? (
                        latestResult.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))
                      ) : (
                        <li>Belum ada data</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Tantangan</h4>
                    <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                      {latestResult.challenges && latestResult.challenges.length > 0 ? (
                        latestResult.challenges.map((challenge, index) => (
                          <li key={index}>{challenge}</li>
                        ))
                      ) : (
                        <li>Belum ada data</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* CTA Card */}
              <div className="p-6 bg-saintara-black text-white rounded-lg shadow-md text-center">
                <h3 className="text-lg font-bold">Siap Bertumbuh Lebih Cepat?</h3>
                <p className="text-sm opacity-80 mb-4">Temukan rahasia mendalam tentang diri Anda.</p>
                <button className="w-full px-4 py-2.5 text-sm font-medium text-saintara-black bg-saintara-yellow hover:bg-yellow-400 rounded-lg">
                  Jadwalkan Sesi Anda
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
