'use client'

import Link from 'next/link'
import { HiBell, HiHome, HiUser, HiClipboardList, HiCreditCard, HiFire, HiNewspaper, HiQuestionMarkCircle, HiCog, HiDownload } from 'react-icons/hi'

export default function UserDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-saintara-black text-white">
        <div className="h-20 flex items-center justify-center border-b border-gray-700">
          <h1 className="text-2xl font-bold tracking-wider text-white">SAINTARA</h1>
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">Selamat datang, Budi Susanto</h2>
          <div className="flex items-center space-x-4">
            <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700">
              <HiBell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-300" />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Character Profile Card */}
              <div className="p-6 bg-white rounded-lg shadow-md flex flex-col md:flex-row items-center">
                <div className="text-center md:text-left md:mr-6 flex-shrink-0 mb-4 md:mb-0">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-saintara-yellow to-yellow-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">PI</span>
                  </div>
                  <h4 className="text-xs text-gray-500 mt-2">PEMIKIR INTROVERT</h4>
                  <h3 className="text-xl font-bold text-saintara-black">Karakter Alami Anda</h3>
                  <p className="text-sm text-gray-600">Dominan Otak Kiri Atas</p>
                </div>
                <div className="border-t md:border-t-0 md:border-l border-gray-200 pl-6 pt-4 md:pt-0">
                  <div className="flex items-center mb-2">
                    <HiFire className="w-6 h-6 text-saintara-yellow mr-2" />
                    <h4 className="font-semibold text-gray-700">Sekilas Tentang Anda</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pemikir Introvert adalah sosok yang cenderung berpikir mendalam, logis, dan analitis. Kekuatan Anda terletak pada analisis internal dan kemampuan melihat sesuatu dari berbagai sudut pandang.
                  </p>
                </div>
              </div>

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
              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Kekuatan</h4>
                  <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                    <li>Analisis Tajam</li>
                    <li>Mandiri</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Tantangan</h4>
                  <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                    <li>Cenderung Overthinking</li>
                    <li>Sulit Beradaptasi Cepat</li>
                  </ul>
                </div>
              </div>

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
