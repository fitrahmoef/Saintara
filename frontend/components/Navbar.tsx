'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HiMenu, HiX } from 'react-icons/hi'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-gray-200 fixed w-full z-20 top-0 border-b">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/" className="flex items-center space-x-3">
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-saintara-black font-poppins">
            Saintara
          </span>
        </Link>

        <div className="flex md:order-2 space-x-3 md:space-x-0">
          <Link
            href="/#harga"
            className="text-white bg-saintara-yellow hover:bg-saintara-black focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors duration-300"
          >
            Mulai Tes
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>

        <div
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } items-center justify-between w-full md:flex md:w-auto md:order-1`}
        >
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <Link
                href="/tentang"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0"
              >
                Tentang
              </Link>
            </li>
            <li>
              <Link
                href="/produk"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0"
              >
                Produk
              </Link>
            </li>
            <li>
              <Link
                href="/pelatihan"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-saintara-yellow md:p-0"
              >
                Pelatihan & Acara
              </Link>
            </li>
            <li>
              <Link
                href="/rahasia"
                className="block py-2 px-3 text-saintara-black font-semibold rounded md:bg-transparent md:p-0"
              >
                Rahasia Karakter
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
