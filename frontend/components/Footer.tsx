import Link from 'next/link'
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-saintara-black text-white">
      <div className="max-w-screen-xl mx-auto p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="self-center text-3xl font-semibold whitespace-nowrap text-white font-poppins">
                Saintara
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-xs">
              Peta sempurna untuk menggali potensi dan menjadi diri sendiri.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-200 uppercase">
                Navigasi
              </h2>
              <ul className="text-gray-400 font-medium">
                <li className="mb-4">
                  <Link href="/#tentang" className="hover:underline">
                    Tentang
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/#harga" className="hover:underline">
                    Paket
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/#" className="hover:underline">
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-200 uppercase">
                Legal
              </h2>
              <ul className="text-gray-400 font-medium">
                <li className="mb-4">
                  <Link href="#" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-700 sm:mx-auto lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-400 sm:text-center">
            © 2025{' '}
            <Link href="/" className="hover:underline">
              Saintara™
            </Link>
            . All Rights Reserved.
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0 space-x-5">
            <Link href="#" className="text-gray-400 hover:text-white">
              <FaInstagram className="w-5 h-5" />
              <span className="sr-only">Instagram page</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <FaLinkedin className="w-5 h-5" />
              <span className="sr-only">LinkedIn page</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <FaTwitter className="w-5 h-5" />
              <span className="sr-only">Twitter page</span>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <FaFacebook className="w-5 h-5" />
              <span className="sr-only">Facebook page</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
