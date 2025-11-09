"use client"

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext" // Pastikan path ini benar
import logo_nav from "@/assets/logo/4.png"
import { HiMenu, HiX, HiUser, HiLogout } from "react-icons/hi"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    // Kontainer luar (posisi floating)
    <nav className="fixed w-full z-20 top-10">
      {/* Kontainer dalam (pil/desain) */}
      <div className="max-w-screen-xl flex flex-wrap items-center px-10 justify-between mx-auto p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200">
        {/* === PERUBAHAN: Logo Uppercase & Bold === */}
        <Link href="/" className="flex items-center space-x-3">
          {/* Tambahkan komponen Image di sini */}
          <Image
            src={logo_nav}
            alt="Logo Saintara"
            width={32} // Sesuaikan ukurannya (misal 32px)
            height={32} // Sesuaikan ukurannya (misal 32px)
            className="h-8 w-8" // Tailwind (h-8 = 2rem = 32px)
            priority // Bagus untuk logo agar dimuat cepat
          />
          <span className="self-center text-2xl uppercase font-bold whitespace-nowrap text-saintara-black font-poppins">SAINTARA</span>
        </Link>
        {/* Tombol Aksi (Kanan) & Toggle Menu Mobile */}
        <div className="flex items-center md:order-2 space-x-3">
          {user ? (
            // Jika user login
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-saintara-yellow">
                <div className="w-8 h-8 rounded-full bg-saintara-yellow flex items-center justify-center">
                  <HiUser className="w-5 h-5 text-white" />
                </div>
                <span className="hidden md:block">{user.name}</span>
              </button>

              {/* Dropdown Menu User */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                  <Link href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      logout()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <HiLogout className="inline w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // === PERUBAHAN: Tombol "Masuk" (Hitam) & Tombol "Daftar" dihapus ===
            <>
              <Link href="/login" className="text-white bg-saintara-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors duration-300">
                MASUK
              </Link>
            </>
          )}

          {/* Tombol Hamburger (Menu Mobile) */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200">
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* === PERUBAHAN: Link Navigasi disesuaikan dengan gambar === */}
        <div className={`${isMenuOpen ? "block" : "hidden"} items-center justify-between w-full md:flex md:w-auto md:order-1`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <Link href="/#tentang" className="block py-2 px-3 text-saintara-black rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0">
                Tentang
              </Link>
            </li>
            <li>
              <Link href="/#produk" className="block py-2 px-3 text-saintara-black rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0">
                Produk
              </Link>
            </li>
            <li>
              <Link href="/calendar" className="block py-2 px-3 text-saintara-black rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0">
                Pelatihan & Acara
              </Link>
            </li>
            <li>
              <Link href="/#karakter-alami" className="block py-2 px-3 text-saintara-black rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0">
                Rahasia Karakter Alami
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
